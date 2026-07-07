import os
import json
import logging
from typing import Dict, Any
from google import genai
from google.genai import types
from pydantic import BaseModel

logger = logging.getLogger("proctor-backend.report_generator")

# Initialize client defensively from environment
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
    logger.info("[Report] Gemini GenAI client initialized.")
else:
    client = None
    logger.warn("[Report] GEMINI_API_KEY environment variable missing. Fallback logic active.")

class ExecutiveSummary(BaseModel):
    overall_assessment: str
    technical_capabilities: str   # Bullet 1: Core capabilities and design choices
    response_accuracy: str        # Bullet 2: Answer accuracy and clarity
    integrity_rating: str         # Bullet 3: Integrity rating

SYSTEM_INSTRUCTION = (
    "You are an expert executive talent evaluator. Your objective is to assess the candidate's complete "
    "session telemetry, risk profiles, and cognitive evaluation scores. "
    "Synthesize these inputs into a concise, professional executive report. "
    "You must return a JSON object mapping to the following Pydantic schema structure: "
    "1. 'overall_assessment': a high-level summary of candidate viability (2-3 sentences). "
    "2. 'technical_capabilities': a concise bullet explaining technical capabilities and code design choices. "
    "3. 'response_accuracy': a concise bullet reviewing response accuracy and conceptual clarity during interventions. "
    "4. 'integrity_rating': a concise bullet detailing the definitive integrity rating based on proctoring infractions. "
    "Do NOT wrap in markdown syntax or code block wrappers. Output only the raw JSON."
)

def get_fallback_summary(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generates a high-quality mock executive summary based on session statistics heuristics."""
    warnings = session_data.get("warnings_count", 0)
    scores = session_data.get("conceptual_scores", [])
    
    # 1. Integrity Rating Bullet
    if warnings >= 3:
        integrity = f"FAILED: Disqualified due to excessive infractions ({warnings}/3 warnings recorded)."
    elif warnings > 0:
        integrity = f"CAUTION: Proctoring log contains minor infractions ({warnings} focus/tab warnings recorded)."
    else:
        integrity = "EXCELLENT: No security anomalies recorded. Perfect screen and visibility compliance."
        
    # 2. Technical Capabilities Bullet
    if scores:
        avg_score = sum(scores) / len(scores)
        if avg_score >= 85:
            tech = "EXCEPTIONAL: Candidate shows elite capabilities, utilizing optimal time complexity and stack limits."
        else:
            tech = "COMPETENT: Candidate shows solid understanding of core logic structure, with moderate resource boundaries."
    else:
        tech = "NOT VALIDATED: No coding updates or justifications submitted to perform evaluation."
        avg_score = 0.0

    # 3. Response Accuracy Bullet
    if scores:
        accuracy = f"CONCEPTUALLY ALIGNED: Candidate answers were evaluated at an average rating of {avg_score:.1f}% accuracy."
    else:
        accuracy = "PENDING: Evaluation metrics incomplete due to no intervention responses."

    # 4. Overall Assessment
    if warnings >= 3:
        assessment = (
            "The candidate was disqualified due to multiple browser-level focus shifts and screen share drops. "
            "The evaluation represents a high risk and the candidate is suspended."
        )
    elif warnings > 0:
        assessment = (
            f"The candidate successfully completed the challenges with an average score of {avg_score:.1f}%. "
            f"Minor proctoring anomalies ({warnings} alerts) were registered, suggesting review is recommended."
        )
    else:
        assessment = (
            f"The candidate completed the workspace challenges with zero proctoring infractions. "
            f"Coding answers showed strong conceptual understanding (average score: {avg_score:.1f}%)."
        )

    return {
        "overall_assessment": assessment,
        "technical_capabilities": tech,
        "response_accuracy": accuracy,
        "integrity_rating": integrity
    }

async def generate_candidate_summary(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Asynchronously evaluates session ledger statistics and calls Gemini 1.5 Pro
    to synthesize an executive candidate assessment report.
    """
    if not client:
        logger.info("[Report] Generating contextual fallback assessment.")
        return get_fallback_summary(session_data)
        
    try:
        # Simplify data object for model prompt context
        context_data = {
            "warnings_count": session_data.get("warnings_count", 0),
            "screen_dimensions": session_data.get("screen_dimensions"),
            "anomalies": session_data.get("anomalies", []),
            "conceptual_scores": session_data.get("conceptual_scores", []),
            "justification_summaries": session_data.get("justification_summaries", []),
            "risk_score": session_data.get("risk_score", 0.0),
            "risk_rating": session_data.get("risk_rating", "Low")
        }
        
        prompt = f"Analyze the following candidate workspace proctoring session logs and data:\n{json.dumps(context_data)}"
        
        # Call Gemini 1.5 Pro asynchronously
        response = client.models.generate_content(
            model='gemini-1.5-pro',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=ExecutiveSummary,
                temperature=0.3
            )
        )
        
        raw_text = response.text.strip() if response.text else "{}"
        result = json.loads(raw_text)
        
        logger.info("[Report] Executive assessment report completed by Gemini 1.5 Pro.")
        return result
        
    except Exception as e:
        logger.error(f"[Report] Error invoking Gemini 1.5 Pro: {e}. Falling back to mock summary.")
        return get_fallback_summary(session_data)
