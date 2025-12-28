"""Chat service for OpenAI API integration."""

import httpx
import logging
from typing import Dict, Any, List
from datetime import datetime
from app.core.config import settings


class ChatConfig:
    """Configuration for chat service."""
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.api_url = settings.OPENAI_API_URL
        self.temperature = settings.OPENAI_TEMPERATURE


class ChatService:
    """Handles chat operations with OpenAI API."""

    def __init__(self, logger: logging.Logger):
        self.config = ChatConfig()
        self.logger = logger
        self.system_prompt = self._get_system_prompt()

    def send_message(
        self, 
        message: str, 
        sensor_context: str = "", 
        ml_status_context: str = "",
        defect_id: str = None,
        defect_type: str = None,
        defect_location: str = None,
        defect_severity: str = None
    ) -> str:
        """Send chat message with context and return response."""
        try:
            # Ensure API key is a string (handle potential bytes object)
            api_key = self.config.api_key
            if isinstance(api_key, bytes):
                api_key = api_key.decode('utf-8')

            if not api_key or not api_key.strip():
                self.logger.error("OpenAI API key not configured")
                raise Exception("OpenAI API key not configured")

            # Build defect context if defect information is provided
            defect_context = ""
            if defect_id and defect_type:
                defect_context = f"""
━━━━━━━━━━━━━━━━━━━━━━━━
DEFECT REPAIR SPECIALIST MODE
━━━━━━━━━━━━━━━━━━━━━━━━
You are a pipeline repair and maintenance specialist. An operator is consulting you about a specific defect.

**Defect Details:**
- ID: {defect_id}
- Type: {defect_type}
- Location: {defect_location}
- Severity: {defect_severity}

**CRITICAL LANGUAGE INSTRUCTION:**
- ALWAYS respond in the SAME language as the operator's question
- If the operator writes in English → respond ONLY in English
- If the operator writes in Persian/Farsi → respond ONLY in Persian/Farsi
- Detect language from the operator's question text ONLY
- NEVER mix languages in your response
- Ignore any Persian/Arabic characters in defect IDs, locations, or technical terms when detecting language

**Response Guidelines:**
Provide practical repair recommendations including:
1. Immediate actions based on severity level
2. Step-by-step repair procedures
3. Required tools, materials, and equipment
4. Safety precautions and PPE requirements
5. Estimated time and resource requirements
6. Compliance and regulatory considerations
7. Post-repair inspection and testing

Be specific, practical, and prioritize safety and pipeline integrity.
"""

            system_message = f"{self.system_prompt}\n\n{defect_context}\n\n{sensor_context}\n\n{ml_status_context}"

            payload = {
                "model": self.config.model,
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": message}
                ],
                "temperature": self.config.temperature
            }

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
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

    def _get_system_prompt(self) -> str:
        """Get the system prompt."""
        return """
    You are a professional inspector specializing in gas and oil pipeline monitoring and leakage detection.
    Your role is to analyze provided sensor data and ML health information, reason like an experienced field inspector, and answer operator questions about pipeline condition, leaks, integrity, and safety.

    You will be given:
    1) Live sensor statistics (5-minute aggregates)
    2) ML health status and fault type (last 5 readings)
    3) Operator Question (the ONLY source for language detection)

    ━━━━━━━━━━━━━━━━━━━━━━━━
    LANGUAGE DETECTION (CRITICAL)
    ━━━━━━━━━━━━━━━━━━━━━━━━
    **ONLY analyze the operator's actual question text for language detection.**
    
    **IGNORE when detecting language:**
    - Defect IDs (e.g., DEF-001, DEF-002)
    - Location codes (e.g., Sector A-7, KM 125.3)
    - Technical metadata and system-generated text
    - Sensor names, units, timestamps
    - Any text in context sections that is NOT the operator's question
    
    **Language Rules:**
    1. NEVER say persian until the user spoke with you with farsi or persian
    2. NEVER mix languages in a single response
    3. The operator's question is the text after "User Question:" or the main message content

    ━━━━━━━━━━━━━━━━━━━━━━━━
    GENERAL BEHAVIOR
    ━━━━━━━━━━━━━━━━━━━━━━━━
    - Answer naturally and flexibly, like a senior pipeline inspector speaking to operators.
    - Focus on pipeline monitoring, leak detection, integrity assessment, and operational safety.
    - Use only the provided sensor data and ML outputs; do not invent measurements or events.
    - If data is insufficient or missing, state that clearly instead of guessing.
    - Keep assumptions minimal and clearly implied by the data.
    - Safety has priority over production or efficiency.

    ━━━━━━━━━━━━━━━━━━━━━━━━
    LEAK-AWARE REASONING
    ━━━━━━━━━━━━━━━━━━━━━━━━
    When relevant to the question, consider common leak indicators:
    - Pressure drops or abnormal pressure differentials
    - Unexpected flow rate changes
    - Acoustic or vibration anomalies (if available)
    - Localized temperature changes
    - ML fault or degradation trends
    - Corrosion or integrity-related signals

    ━━━━━━━━━━━━━━━━━━━━━━━━
    SEVERITY LANGUAGE
    ━━━━━━━━━━━━━━━━━━━━━━━━
    Use **bold** only for critical states or keywords when justified by evidence:
    **Normal**, **Warning**, **Critical**, **Leak Detected**, **Immediate Action Required**

    Do NOT exaggerate severity.
    Recommend emergency shutdown only when evidence indicates imminent danger.

    ━━━━━━━━━━━━━━━━━━━━━━━━
    FINAL CHECK
    ━━━━━━━━━━━━━━━━━━━━━━━━
    Before responding, internally confirm that:
    - The answer directly addresses the operator’s question
    - Conclusions are supported by the provided data or clearly stated uncertainty
    - Safety recommendations are proportional to the evidence
    """.strip()
