"""Chat service for OpenAI API integration."""

import httpx
import logging
from typing import Dict, Any, List
from datetime import datetime
from .interfaces import IChatService
from .config import ChatConfig


class ChatService(IChatService):
    """Handles chat operations with OpenAI API."""

    def __init__(self, config: ChatConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.system_prompt = self._get_system_prompt()

    def send_message(self, message: str, sensor_context: str, ml_status_context: str) -> str:
        """Send chat message with context and return response."""
        try:
            # Ensure API key is a string (handle potential bytes object)
            api_key = self.config.api_key
            if isinstance(api_key, bytes):
                api_key = api_key.decode('utf-8')

            if not api_key or not api_key.strip():
                self.logger.error("OpenAI API key not configured")
                raise Exception("OpenAI API key not configured")

            system_message = f"{self.system_prompt}\n\nFailure-mode knowledge base:\n{self.failure_kb}\n\n{sensor_context}\n\n{ml_status_context}"

            user_message_with_context = f"{message}\n\n[Recent ML Predictions Context - Last 5 readings]:\n{ml_status_context}"

            payload = {
                "model": self.config.model,
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message_with_context}
                ],
                "temperature": self.config.temperature
            }

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.config.api_key}"
            }

            with httpx.Client(timeout=90.0) as client:
                response = client.post(self.config.api_url, json=payload, headers=headers)

            if response.status_code != 200:
                self.logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                raise Exception(f"API request failed: {response.status_code}")

            data = response.json()
            return data["choices"][0]["message"]["content"]

        except Exception as e:
            self.logger.error(f"Chat service error: {e}")
            raise

    def generate_maintenance_table(self, sensor_stats, ml_status, assets_input, overall_equipment_rul=None):
        """
        Returns STRICT JSON for the maintenance table.
        Uses Structured Outputs for newer models, JSON mode for older models.
        """
        api_key = self.config.api_key
        if isinstance(api_key, bytes):
            api_key = api_key.decode("utf-8")
        if not api_key or not api_key.strip():
            raise Exception("OpenAI API key not configured")

        # Determine which method to use based on model version
        use_structured_outputs = self._supports_structured_outputs(self.config.model)

        # --- JSON Schema for the table response ---
        schema = {
            "name": "maintenance_table",
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "generated_at": {"type": "string"},
                    "assets": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "component": {"type": "string"},
                                "health_score": {"type": "number", "minimum": 0, "maximum": 100},
                                "risk_level": {"type": "string", "enum": ["normal", "warning", "critical"]},
                                "sign": {"type": "string"},
                                "days_to_action": {"type": "number"},
                                "trend": {"type": "string", "enum": ["up", "down", "stable"]},
                                "action": {"type": "string", "enum": ["Monitor", "Inspect", "Repair", "Replace", "Stop Immediately"]},
                                "recommended_action": {"type": "string"},
                                "reason": {"type": ["string", "null"]}
                            },
                            "required": [
                                "component",
                                "health_score",
                                "risk_level",
                                "sign",
                                "days_to_action",
                                "trend",
                                "action",
                                "recommended_action",
                                "reason"
                            ]
                        }
                    }
                },
                "required": ["generated_at", "assets"]
            },
            "strict": True
        }

        # Optimized system prompt
        system_prompt = f"""You are a senior rotating-equipment reliability engineer (pump + motor).

KNOWLEDGE BASE (use for mapping sign -> action):
{self._get_failure_kb()}

TASK:
Generate a maintenance table with EXACTLY 10 rows, one per component in assets_input, in the SAME order.

INPUTS:
- assets_input: list of 10 objects {{component, sensor_keys[]}}
- sensor_stats: dict sensor_key -> {{mean,std,min,max,count}} for last window
- ml_status: last 5 readings {{time, health_status_code, health_status?, fault_type?}}

OUTPUT:
Return ONLY valid JSON matching the given schema (no extra text).

RULES:
0) If assets_input row includes "hi" (0–100), use it as the baseline health_score.
   - If hi is null, fall back to sensor_stats logic + missing-signal rule.
1) For each component, evaluate ALL its sensor_keys. If some are missing in sensor_stats, mention which are missing in reason.
   If ALL are missing -> risk_level="warning", action="Inspect", sign="Missing signals", days_to_action=7, health_score in 45–70.
2) Trend from health_status_code sequence:
   - severity increasing => trend="down"
   - severity decreasing => trend="up"
   - otherwise => trend="stable"
3) risk_level:
   - critical if ML health_status is Failure/Critical OR fault_type not in ["none","Normal","Normal operation"]
   - warning if ML health_status is Warning
   - normal otherwise
4) sign:
   - short, component-specific most likely issue (e.g., cavitation, misalignment, lubrication loss, looseness)
   - must be supported by sensor evidence (mean/min/max) + KB logic
5) health_score must obey:
   - normal: 75–100
   - warning: 40–75
   - critical: 0–39
6) days_to_action:
   - Use overall_equipment_rul_days as baseline for component RUL estimation.
   - Estimate each component's remaining life based on its HI relative to the overall equipment RUL.
   - Better components (higher HI) should have longer RUL than the overall equipment.
   - Worse components (lower HI) should have shorter RUL than the overall equipment.
   - Set days_to_action = max(0, estimated_component_rul - 14).
   - critical: 0–1
   - warning: 1–30
   - normal: 30–180
7) action:
   - normal => "Monitor"
   - warning => "Inspect" or "Repair"
   - critical => "Stop Immediately" or "Replace"
8) recommended_action:
   - one clear instruction for maintenance engineer, specific to the component (what to check / where / what to fix)
9) reason:
   - Include specific numbers: reference ML status + 2–3 strongest sensor signals with their actual mean, min, max values (e.g., "vibration_velocity_mm_s: mean=3.45, min=2.1, max=5.2") and explain why these values imply the sign/action needed.
   - If signals missing, say which keys are missing with their specific values.

Return exactly 10 items in assets. No extra keys. No extra text.""".strip()

        # Simplify payload to reduce size and processing time
        user_payload = {
            "assets_input": assets_input,
            "sensor_stats": sensor_stats,
            "ml_status": ml_status,
            "overall_equipment_rul_days": overall_equipment_rul
        }

        # Choose response format based on model capabilities
        if use_structured_outputs:
            response_format = {"type": "json_schema", "json_schema": schema}
        else:
            response_format = {"type": "json_object"}
            # For JSON mode, ensure "JSON" appears in the prompt
            if "JSON" not in system_prompt:
                system_prompt += "\n\nYou must respond with valid JSON."

        payload = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate the maintenance table:\n{user_payload}"}
            ],
            "response_format": response_format
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

        with httpx.Client(timeout=60.0) as client:
            resp = client.post(self.config.api_url, json=payload, headers=headers)


        if resp.status_code != 200:
            raise Exception(f"OpenAI API failed: {resp.status_code} - {resp.text}")

        data = resp.json()

        # Handle response based on method used
        if use_structured_outputs:
            # For structured outputs, content is already parsed JSON
            content = data["choices"][0]["message"]["content"]
            import json
            return json.loads(content)
        else:
            # For JSON mode, handle edge cases
            if "choices" not in data or not data["choices"]:
                raise Exception(f"Invalid API response: {data}")

            choice = data["choices"][0]

            # Check for refusal
            if choice.get("finish_reason") == "content_filter":
                raise Exception("Content filter triggered - response may be incomplete")

            content = choice["message"]["content"]

            if not content or not content.strip():
                raise Exception("Empty response from OpenAI API")

            # Parse JSON response
            import json
            try:
                result = json.loads(content)
                # Validate basic structure
                if not isinstance(result, dict) or "assets" not in result:
                    raise ValueError("Invalid JSON structure")
                return result
            except json.JSONDecodeError as e:
                raise Exception(f"Failed to parse JSON response: {e}. Content: {content[:500]}...")

    def _supports_structured_outputs(self, model_name: str) -> bool:
        """
        Check if the model supports Structured Outputs (JSON Schema).
        Newer models like GPT-4o, GPT-4 Turbo support this, older ones like GPT-3.5 only support JSON mode.
        """
        # Models that support Structured Outputs
        structured_output_models = {
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4-turbo-preview',
            'gpt-4-0125-preview',
            'gpt-4-1106-preview',
            'gpt-4',
            'gpt-4-0613', 
            'gpt-4.1-nano',
            'gpt-5-nano'
        }

        # Check if model name contains any of the supported model identifiers
        model_lower = model_name.lower()
        return any(supported in model_lower for supported in structured_output_models)

    def _get_system_prompt(self) -> str:
        """Get the system prompt."""
        return """
You are a senior rotating-equipment reliability engineer specializing in pumps, motors, and coupled pump trains.
You operate like an experienced field engineer on shift: safety-first, evidence-driven, calm, and decisive.
You must NOT invent sensors, measurements, failure IDs, or equipment fields. Use ONLY the provided KB + live sensor stats + ML status.

You will be given:
1) Failure-mode knowledge base (KB)
2) Live sensor statistics (5-min aggregates)
3) ML health status + fault type (last 5 readings)
4) Operator message (English or Persian)

━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE
━━━━━━━━━━━━━━━━━━━━━━━━
- Detect language from the operator message:
  - If ANY Persian/Arabic character exists → respond in Persian
  - Else → respond in English
- Never mix languages in one response.

━━━━━━━━━━━━━━━━━━━━━━━━
INTENT & OUTPUT STYLE
━━━━━━━━━━━━━━━━━━━━━━━━
Decide the response style from the operator’s message (prioritize the operator’s explicit request):

A) REPORT MODE (structured report)
Trigger if the operator clearly asks for a report, e.g. message starts with:
- "REPORT", "report:", "گزارش", "گزارش:"
OR the operator explicitly says they want a “full report / complete report / structured report”.

B) CONVERSATION MODE (default)
Use for all other cases, including any maintenance question about motors/pumps (or the pump train).
In this mode:
- Answer naturally like a professional reliability engineer (no rigid sections by default).
- Be direct and practical, like you’re talking to an operator/maintenance tech.
- If the operator asks for details, numbers, calculations, comparisons, or “explain more”, then provide deeper technical detail.
- If you have strong recommendations, give them clearly with urgency and safety framing.

━━━━━━━━━━━━━━━━━━━━━━━━
GENERAL RULES (ALL MODES)
━━━━━━━━━━━━━━━━━━━━━━━━
- Evidence first: cross-check ML output with sensor stats. If they disagree, explicitly flag the mismatch and what you trust more (and why).
- Use bold only for critical states/keywords: **Normal**, **Warning**, **Critical**, **Stable**, **Rising**, **Increased**, **Decreased**
- Recommend **STOP** only when risk is high or escalation is imminent based on evidence.
- Use KB-defined urgency labels exactly: ≤1h, ≤8h, ≤12h, ≤72h, Weekly
- Reference only provided signals (sensor stats + ML fields). If a needed signal is missing, request it explicitly.
- Keep assumptions explicit and minimal.
- End with a brief self-check (1–2 lines): confirm the conclusion is consistent with the evidence; if not, correct or ask for what’s missing.

━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION MODE (DEFAULT) — HOW TO RESPOND
━━━━━━━━━━━━━━━━━━━━━━━━
Goal: Answer the operator’s question well, not to follow a template.

Guidelines:
- Start by directly answering the question.
- Then add the “why” using only the available evidence (ML + sensors + KB).
- Provide practical next steps: what to check, what to do now, and what to plan.
- If the operator asks for numbers/details, you may include:
  - Specific sensor values/threshold comparisons (only from provided data)
  - Trend interpretation across last readings (if provided)
  - Clear prioritization with KB urgencies
- Keep it readable and field-oriented (what an engineer would actually say on site).

When giving recommendations, structure them naturally:
- Immediate operator actions (≤1h / ≤8h)
- Short-horizon maintenance actions (≤12h / ≤72h)
- Routine follow-ups (Weekly)
(Do this naturally, not as rigid headings unless the user asks for structured output.)

━━━━━━━━━━━━━━━━━━━━━━━━
REPORT MODE (STRUCTURED REPORT)
━━━━━━━━━━━━━━━━━━━━━━━━
When in REPORT MODE, use EXACTLY this structure:

**Summary:**
(2–3 lines)

# Maintenance Advisory Report
**Asset:** [name or Unknown]
**Timestamp:** [time or Unknown]

## ML Prediction Summary
- Status: **[Normal/Warning/Failure]**
- Fault: **[type or none]**
- Trend: **[Stable/Deteriorating/Normal→Warning]**
- Sensors monitored: [N sensors]

## Snapshot Signals
(If data exists, group by category)
- Vibration: **[status]** — evidence
- Temperature: **[status]** — evidence
- Electrical: **[status]** — evidence
- Flow/Pressure: **[status]** — evidence

## Most Likely Issues
1. Issue — justification (ML + sensors)
2. Issue — justification

## Stop/Run Decision
- **RUN** or **STOP**
- Brief reason (1–2 lines)

## Immediate Operator TODO (0–60 min)
- KB-based action items

## Maintenance/Engineering TODO (8–72 h)
- KB-based action items

## Electrical TODO (if applicable)
- KB-based action items

## What to Verify Next
- Missing signals or recommended tests

## Notes/Safety
- Safety cautions

Important: In REPORT MODE, do not add extra call-to-action text outside the sections.

━━━━━━━━━━━━━━━━━━━━━━━━
FINAL SELF-CHECK (ALL MODES)
━━━━━━━━━━━━━━━━━━━━━━━━
Before finishing:
- Confirm the conclusion matches ML + sensor evidence.
- If key evidence is missing or contradictory, state what you need and provide the safest interim guidance.
""".strip()


    def _get_failure_kb(self) -> str:
        """Get the failure knowledge base."""
        return """Component–Sensor–Fault Knowledge Base:

1. Casing
Sensors: Accelerometer, Vibration Velocity, Acoustic (Sound), Discharge Pressure, Outlet Temperature
Typical Faults: Structural looseness, casing cracks, fluid leakage
Recommended Actions: Tighten mounting bolts, inspect casing integrity, repair or seal leaks

2. Bearings
Sensors: Accelerometer, Vibration Velocity, Shaft Displacement, Bearing Temperature, Oil Temperature, Acoustic (Sound), Power
Typical Faults: Bearing wear, lubrication loss, misalignment
Recommended Actions: Verify lubrication condition, check shaft alignment, replace bearings if degradation persists

3. Pump Shaft
Sensors: Shaft Displacement, Vibration Velocity, Acoustic (Sound), Power
Typical Faults: Shaft bending, mass unbalance
Recommended Actions: Inspect shaft straightness, verify coupling balance and alignment

4. Lubrication System
Sensors: Oil Temperature, Bearing Temperature, Acoustic (Sound), Power
Typical Faults: Oil degradation, contamination, insufficient lubrication
Recommended Actions: Analyze oil quality, replace filters, refill or change lubricant

5. Motor
Sensors: Electrical Current, Voltage, Power, Acoustic (Sound)
Typical Faults: Electrical overload, winding faults, cooling inefficiency
Recommended Actions: Check current balance, inspect ventilation and cooling, perform electrical tests

6. Impeller
Sensors: Accelerometer, Vibration Velocity, Flow Rate, Discharge Pressure, Acoustic (Sound)
Typical Faults: Erosion, fouling, hydraulic imbalance
Recommended Actions: Inspect impeller condition, clean deposits, repair or replace if necessary

7. Mechanical Seal
Sensors: Bearing Temperature, Oil Temperature, Acoustic (Sound), Suction Pressure
Typical Faults: Seal leakage, thermal overheating
Recommended Actions: Inspect seal flushing system, verify cooling, replace seal if damaged

8. Suction Pipe Side
Sensors: Suction Pressure, Flow Rate, Inlet Temperature, Acoustic (Sound)
Typical Faults: Cavitation, blockage, inlet restriction
Recommended Actions: Inspect suction strainer, valves, and inlet piping for obstructions

9. Discharge Pipe Side
Sensors: Discharge Pressure, Flow Rate, Outlet Temperature, Acoustic (Sound)
Typical Faults: Flow restriction, valve obstruction
Recommended Actions: Check discharge valves, clean pipeline, remove restrictions

10. Coupling / Alignment
Sensors: Shaft Displacement, Vibration Velocity, Acoustic (Sound), Power
Typical Faults: Misalignment, mechanical looseness
Recommended Actions: Perform precision alignment, tighten coupling bolts, verify mounting integrity
""".strip()
