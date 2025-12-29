"""
Defect Knowledge Base - Comprehensive information for each defect type
"""

from typing import Dict, Any, List
from enum import Enum


class DataAgreementCase(Enum):
    """Data agreement scenarios"""
    BOTH_AGREE = "both_agree"
    CONTROL_INDICATES = "control_indicates"
    DRONE_INDICATES = "drone_indicates"


class DefectKnowledge:
    """Knowledge base for pipeline defects"""
    
    # Comprehensive defect information
    DEFECT_INFO: Dict[str, Dict[str, Any]] = {
        "Major/Sudden Leak": {
            "action_level": "IMMEDIATE ACTION",
            "action_description": "This level is assigned even if only one data source strongly indicates the defect.",
            "primary_recommendation": "Immediate pressure reduction and preparation for isolation of the affected pipeline segment are required.",
            
            "problem_detail": "Sudden pressure drop and/or confirmed gas release indicate a high-severity leak. Due to safety and environmental risk, immediate preventive action is required even if all data sources are not yet fully aligned.",
            
            "causes": [
                "Sudden mechanical failure or rupture",
                "Third-party damage (excavation, impact)",
                "Severe corrosion breakthrough",
                "Weld or joint failure",
                "Overpressure event",
                "Material defect or fatigue crack propagation"
            ],
            
            "detailed_actions": {
                "control_safety": [
                    "Gradually reduce line pressure to the lowest safe operating level",
                    "Prepare for sectional isolation around the suspected leak location",
                    "Restrict access to the affected corridor"
                ],
                "verification": [
                    "Dispatch focused drone inspection if not already available",
                    "Cross-check leak location using pressure and flow gradients",
                    "Confirm plume persistence or growth"
                ],
                "emergency_response": [
                    "Notify emergency response and safety teams",
                    "Prepare gas detection and firefighting resources",
                    "Initiate environmental and safety monitoring"
                ]
            },
            
            "ui_message": "Major Leakage Detected - Immediate pressure reduction and pipeline isolation recommended. High safety and environmental risk.",
            
            "data_agreement_cases": {
                DataAgreementCase.BOTH_AGREE: {
                    "confidence": "90-99%",
                    "message": "Major leak confirmed by process and visual data.",
                    "instruction": "Full execution of emergency and isolation procedures."
                },
                DataAgreementCase.CONTROL_INDICATES: {
                    "confidence": "75-90%",
                    "message": "Process data strongly indicates major leakage. Visual confirmation may be delayed.",
                    "instruction": "Begin pressure reduction and prepare isolation while verification continues."
                },
                DataAgreementCase.DRONE_INDICATES: {
                    "confidence": "70-85%",
                    "message": "Strong visual evidence of gas release detected. Process response may lag.",
                    "instruction": "Treat as major leak; initiate preventive actions immediately."
                }
            }
        },
        
        "Minor/Gradual Leak": {
            "action_level": "CONDITIONAL ACTION / ENHANCED MONITORING",
            "action_description": "No immediate shutdown unless escalation is observed.",
            "primary_recommendation": "Continue operation under enhanced monitoring and initiate targeted inspection of the suspected location.",
            
            "problem_detail": "Low-level but persistent deviations indicate a potential gradual leak. Immediate shutdown is not required, but continued monitoring and verification are necessary to prevent escalation.",
            
            "causes": [
                "Small pinhole leak from corrosion",
                "Minor seal or gasket degradation",
                "Micro-crack in pipe wall",
                "Loose fitting or connection",
                "Early-stage coating failure with minor breach",
                "Thread or flange weeping"
            ],
            
            "detailed_actions": {
                "monitoring": [
                    "Increase frequency of pressure and flow trend evaluation",
                    "Closely track mass imbalance persistence",
                    "Flag the segment for continuous anomaly monitoring"
                ],
                "verification": [
                    "Schedule repeated drone inspection over the same location",
                    "Focus on gas concentration trends",
                    "Monitor repeatability of thermal anomaly",
                    "Correlate drone location with control-system trends"
                ],
                "preventive_planning": [
                    "Register the location for planned inspection or maintenance",
                    "Avoid increasing operating pressure in the affected segment",
                    "Prepare contingency plan if indicators escalate"
                ]
            },
            
            "ui_message": "Possible Minor Leakage Detected - Enhanced monitoring and targeted inspection recommended. No immediate shutdown required.",
            
            "data_agreement_cases": {
                DataAgreementCase.BOTH_AGREE: {
                    "confidence": "70-85%",
                    "message": "Consistent low-level leak indicators detected by process and drone data.",
                    "instruction": "Enhanced monitoring + scheduled inspection."
                },
                DataAgreementCase.CONTROL_INDICATES: {
                    "confidence": "60-75%",
                    "message": "Process trends suggest gradual leakage; visual confirmation is weak or intermittent.",
                    "instruction": "Continue operation, repeat drone inspection, monitor trends."
                },
                DataAgreementCase.DRONE_INDICATES: {
                    "confidence": "55-70%",
                    "message": "Localized gas detection observed; process response may be below detection threshold.",
                    "instruction": "Treat as early-stage leak, increase monitoring sensitivity."
                }
            }
        },
        
        "Corrosion & Erosion": {
            "action_level": "SCHEDULED MAINTENANCE / PREVENTIVE ACTION",
            "action_description": "No emergency response required unless combined with leakage indicators.",
            "primary_recommendation": "Continue operation and schedule detailed inspection and preventive maintenance for the affected pipeline segment.",
            
            "problem_detail": "Observed surface degradation and/or long-term process trends indicate progressive material loss. While no immediate failure is detected, preventive maintenance is required to avoid future leakage.",
            
            "causes": [
                "External corrosion (coating failure, moisture, soil chemistry)",
                "Internal corrosion (CO2, H2S, water content)",
                "Microbiologically influenced corrosion (MIC)",
                "Erosion from high-velocity flow or particulates",
                "Galvanic corrosion at dissimilar metal joints",
                "Cathodic protection system failure"
            ],
            
            "detailed_actions": {
                "integrity_inspection": [
                    "Register the affected location as a high-risk degradation zone",
                    "Schedule field inspection (visual, UT, or NDT if available)",
                    "Verify coating condition and corrosion protection systems"
                ],
                "operational_precautions": [
                    "Avoid increasing operating pressure in the affected segment",
                    "Maintain steady operating conditions to limit erosion acceleration",
                    "Monitor pressure and flow trends for escalation"
                ],
                "maintenance_planning": [
                    "Include the segment in the next maintenance or rehabilitation window",
                    "Prioritize coating repair or corrosion mitigation measures",
                    "Review cathodic protection (if applicable)"
                ]
            },
            
            "ui_message": "Corrosion / Erosion Detected - Progressive degradation identified. Preventive inspection and maintenance recommended.",
            
            "data_agreement_cases": {
                DataAgreementCase.BOTH_AGREE: {
                    "confidence": "80-90%",
                    "message": "Surface degradation and long-term process trends consistently indicate corrosion or erosion.",
                    "instruction": "Schedule inspection and maintenance with elevated priority."
                },
                DataAgreementCase.DRONE_INDICATES: {
                    "confidence": "65-80%",
                    "message": "Visual evidence of corrosion detected; process impact not yet measurable.",
                    "instruction": "Treat as early-stage degradation and plan preventive action."
                },
                DataAgreementCase.CONTROL_INDICATES: {
                    "confidence": "60-75%",
                    "message": "Long-term hydraulic changes suggest internal degradation; surface confirmation pending.",
                    "instruction": "Flag for inspection and verify during next field access."
                }
            }
        },
        
        "Mechanical Damage": {
            "action_level": "IMMEDIATE ACTION (PREVENTIVE)",
            "action_description": "Even without leakage, this defect is treated as high risk.",
            "primary_recommendation": "Initiate immediate field verification and reduce mechanical stress on the affected pipeline segment.",
            
            "problem_detail": "Physical damage or third-party interference has been detected. Although no leakage is currently observed, the structural integrity of the pipeline may be compromised.",
            
            "causes": [
                "Third-party excavation or construction activity",
                "Vehicle or equipment impact",
                "Ground movement or subsidence",
                "Falling objects or debris",
                "Vandalism or intentional damage",
                "Natural disasters (landslides, earthquakes)"
            ],
            
            "detailed_actions": {
                "safety_control": [
                    "Avoid pressure or flow increases in the affected segment",
                    "Minimize operational transients (rapid start/stop, flow changes)",
                    "Restrict third-party access to the location"
                ],
                "field_verification": [
                    "Dispatch field inspection team to the exact location",
                    "Verify pipe deformation or dents",
                    "Check support condition",
                    "Investigate ongoing excavation or external interference"
                ],
                "preventive_measures": [
                    "Secure the area if unauthorized activity is detected",
                    "Temporarily reinforce supports if required",
                    "Prepare contingency plan for isolation if damage worsens"
                ]
            },
            
            "ui_message": "Mechanical Damage Detected - Physical integrity may be compromised. Immediate inspection and stress reduction recommended.",
            
            "data_agreement_cases": {
                DataAgreementCase.DRONE_INDICATES: {
                    "confidence": "80-95%",
                    "message": "Physical damage detected with no immediate process response.",
                    "instruction": "Treat as high-risk condition and act preventively."
                },
                DataAgreementCase.BOTH_AGREE: {
                    "confidence": "90-98%",
                    "message": "Mechanical damage affecting structural stability detected.",
                    "instruction": "Immediate inspection and operational stress reduction required."
                },
                DataAgreementCase.CONTROL_INDICATES: {
                    "confidence": "60-75%",
                    "message": "Possible mechanical disturbance detected; visual confirmation pending.",
                    "instruction": "Initiate drone re-inspection and maintain conservative operation."
                }
            }
        },
        
        "Insulation/Coating Failure": {
            "action_level": "SCHEDULED MAINTENANCE / PREVENTIVE ACTION",
            "action_description": "No emergency shutdown required.",
            "primary_recommendation": "Continue operation and schedule repair of insulation or coating at the identified location to prevent long-term degradation.",
            
            "problem_detail": "Loss of insulation or coating has been detected. Although no immediate failure is present, the exposed pipeline is vulnerable to corrosion and future leakage.",
            
            "causes": [
                "UV degradation of coating material",
                "Mechanical damage to insulation during installation or maintenance",
                "Thermal cycling causing coating disbondment",
                "Moisture ingress and freeze-thaw cycles",
                "Chemical attack on coating material",
                "Age-related deterioration of protective layers"
            ],
            
            "detailed_actions": {
                "inspection_verification": [
                    "Confirm extent of coating or insulation damage",
                    "Review thermal images to identify exposed or heat-loss areas",
                    "Verify environmental exposure (humidity, soil contact, standing water)"
                ],
                "operational_precautions": [
                    "Maintain stable operating temperature and pressure",
                    "Avoid thermal cycling in the affected segment",
                    "Monitor temperature trends for escalation"
                ],
                "maintenance_planning": [
                    "Schedule insulation or coating repair during next maintenance window",
                    "Inspect adjacent areas for similar degradation",
                    "Coordinate with corrosion prevention teams"
                ]
            },
            
            "ui_message": "Insulation / Coating Failure Detected - Preventive repair recommended to protect pipeline integrity.",
            
            "data_agreement_cases": {
                DataAgreementCase.BOTH_AGREE: {
                    "confidence": "85-95%",
                    "message": "Thermal anomalies and visual damage consistently indicate insulation or coating failure.",
                    "instruction": "Schedule maintenance with high preventive priority."
                },
                DataAgreementCase.DRONE_INDICATES: {
                    "confidence": "70-85%",
                    "message": "Visual insulation or coating damage detected; process impact not yet measurable.",
                    "instruction": "Plan repair before environmental exposure worsens."
                },
                DataAgreementCase.CONTROL_INDICATES: {
                    "confidence": "60-75%",
                    "message": "Abnormal heat transfer detected; surface condition verification required.",
                    "instruction": "Perform targeted drone or field inspection."
                }
            }
        },
        
        "Poor Pipe Support": {
            "action_level": "CONDITIONAL ACTION / STRUCTURAL INTERVENTION",
            "action_description": "Immediate shutdown is not required, but ignoring the defect increases failure probability.",
            "primary_recommendation": "Continue operation with restricted transients and initiate structural inspection and support correction.",
            
            "problem_detail": "Structural support deficiency has been identified. While no immediate leak is present, continued operation without corrective action increases mechanical stress and fatigue risk.",
            
            "causes": [
                "Support structure corrosion or degradation",
                "Foundation settlement or soil erosion",
                "Missing or broken support brackets",
                "Improper installation or spacing",
                "Thermal expansion causing support misalignment",
                "Vibration-induced support loosening"
            ],
            
            "detailed_actions": {
                "operational_precautions": [
                    "Avoid rapid changes in flow rate or pressure",
                    "Maintain steady-state operation as much as possible",
                    "Monitor vibration trends continuously"
                ],
                "field_structural_inspection": [
                    "Dispatch inspection team to verify support condition",
                    "Check for loose, broken, or missing supports",
                    "Assess pipe sagging or misalignment",
                    "Evaluate soil erosion, washout, or subsidence"
                ],
                "corrective_measures": [
                    "Reinforce or realign supports where required",
                    "Stabilize soil beneath the pipeline if erosion is detected",
                    "Reassess pipe stress after corrective action"
                ]
            },
            
            "ui_message": "Poor Pipe Support Detected - Structural correction recommended. Restrict operational transients.",
            
            "data_agreement_cases": {
                DataAgreementCase.BOTH_AGREE: {
                    "confidence": "85-95%",
                    "message": "Support failure confirmed with mechanical response detected.",
                    "instruction": "Restrict operating transients and initiate corrective support work."
                },
                DataAgreementCase.DRONE_INDICATES: {
                    "confidence": "70-85%",
                    "message": "Support damage detected; process response not yet visible.",
                    "instruction": "Treat as early-stage structural risk and act preventively."
                },
                DataAgreementCase.CONTROL_INDICATES: {
                    "confidence": "60-75%",
                    "message": "Mechanical anomalies detected; structural confirmation pending.",
                    "instruction": "Reinspect supports using drone or field inspection."
                }
            }
        }
    }
    
    @classmethod
    def get_defect_info(cls, defect_type: str) -> Dict[str, Any]:
        """Get comprehensive information for a defect type"""
        return cls.DEFECT_INFO.get(defect_type, {})
    
    @classmethod
    def get_initial_chat_message(cls, defect_type: str, location: str, severity: str, 
                                  control_sign: str = "Unknown", drone_sign: str = "Unknown") -> str:
        """Generate initial detailed message when chat is opened"""
        info = cls.get_defect_info(defect_type)
        if not info:
            return f"Defect type '{defect_type}' information not available."
        
        # Determine data agreement case
        agreement_case = cls._determine_agreement_case(control_sign, drone_sign)
        case_info = info.get("data_agreement_cases", {}).get(agreement_case, {})
        
        message = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**DEFECT ANALYSIS: {defect_type}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📍 Location:** {location}
**⚠️ Severity:** {severity}
**🎯 Action Level:** {info.get('action_level', 'N/A')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**🔍 PROBLEM DETAIL**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{info.get('problem_detail', 'No detailed information available.')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**💡 WHAT CAUSES THIS PROBLEM**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Common causes include:
"""
        
        causes = info.get('causes', [])
        for i, cause in enumerate(causes, 1):
            message += f"\n{i}. {cause}"
        
        message += f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**📋 RECOMMENDED ACTIONS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Primary Recommendation:**
{info.get('primary_recommendation', 'N/A')}
"""
        
        # Add detailed actions
        detailed_actions = info.get('detailed_actions', {})
        for category, actions in detailed_actions.items():
            category_name = category.replace('_', ' ').title()
            message += f"\n\n**{category_name}:**"
            for action in actions:
                message += f"\n• {action}"
        
        # Add data agreement case information
        if case_info:
            message += f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**📊 DATA AGREEMENT ANALYSIS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Control System:** {control_sign}
**Drone Status:** {drone_sign}

**AI Confidence:** {case_info.get('confidence', 'N/A')}
**Assessment:** {case_info.get('message', 'N/A')}
**Operator Instruction:** {case_info.get('instruction', 'N/A')}
"""
        
        message += """

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**❓ How can I help you further?**

You can ask me:
• Specific repair procedures
• Required tools and materials
• Safety precautions
• Time and resource estimates
• Regulatory compliance requirements
• Any other questions about addressing this defect
"""
        
        return message.strip()
    
    @classmethod
    def _determine_agreement_case(cls, control_sign: str, drone_sign: str) -> DataAgreementCase:
        """Determine which data agreement case applies"""
        control_positive = control_sign.lower() in ['detected', 'positive', 'confirmed', 'yes']
        drone_positive = drone_sign.lower() in ['detected', 'positive', 'confirmed', 'yes']
        
        if control_positive and drone_positive:
            return DataAgreementCase.BOTH_AGREE
        elif control_positive:
            return DataAgreementCase.CONTROL_INDICATES
        elif drone_positive:
            return DataAgreementCase.DRONE_INDICATES
        else:
            # Default to both agree if unclear
            return DataAgreementCase.BOTH_AGREE
    
    @classmethod
    def build_defect_context_prompt(cls, defect_type: str, location: str, severity: str,
                                     control_sign: str = "Unknown", drone_sign: str = "Unknown") -> str:
        """Build enhanced context prompt for defect-specific chat"""
        info = cls.get_defect_info(defect_type)
        if not info:
            return ""
        
        agreement_case = cls._determine_agreement_case(control_sign, drone_sign)
        case_info = info.get("data_agreement_cases", {}).get(agreement_case, {})
        
        context = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEFECT SPECIALIST MODE - ENHANCED CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a pipeline repair and maintenance specialist consulting with an operator about a specific defect.

**Defect Information:**
- Type: {defect_type}
- Location: {location}
- Severity: {severity}
- Control System Status: {control_sign}
- Drone Status: {drone_sign}

**Action Level:** {info.get('action_level', 'N/A')}
**Primary Recommendation:** {info.get('primary_recommendation', 'N/A')}

**Known Causes:**
{chr(10).join(f"• {cause}" for cause in info.get('causes', []))}

**Data Agreement Assessment:**
- AI Confidence: {case_info.get('confidence', 'N/A')}
- Status: {case_info.get('message', 'N/A')}
- Instruction: {case_info.get('instruction', 'N/A')}

**CRITICAL INSTRUCTIONS:**
1. The operator has already received the initial detailed problem analysis
2. Answer follow-up questions within the context of THIS SPECIFIC DEFECT
3. Provide practical, actionable advice based on the defect type and severity
4. ALWAYS respond in the SAME language as the operator's question
5. Focus on repair procedures, safety, tools, materials, and compliance
6. If the question is outside the scope of this defect, politely redirect to the defect context

**Response Guidelines:**
- Be specific and practical
- Prioritize safety and pipeline integrity
- Reference the defect's known causes and recommended actions
- Provide step-by-step guidance when appropriate
- Include resource requirements (time, materials, personnel)
- Address regulatory and compliance considerations when relevant
"""
        
        return context.strip()

