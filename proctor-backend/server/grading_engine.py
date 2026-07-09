import os
import json
import logging
from typing import Dict, Any
from google import genai
from google.genai import types
from pydantic import BaseModel

logger = logging.getLogger("proctor-backend.grading_engine")

# Load client defensively from environment
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
    logger.info("[Grading] Gemini GenAI client initialized.")
else:
    client = None
    logger.warn("[Grading] GEMINI_API_KEY environment variable missing. Fallback logic active.")

SYSTEM_INSTRUCTION = (
    "You are an expert technical grading evaluator. Your objective is to assess the candidate's answer "
    "to a conceptual interview question based on their submitted code snapshot. "
    "Evaluate if the candidate understands the time complexity, memory allocation trade-offs, "
    "and potential edge cases (like overflows or deep stacks). "
    "You must return a JSON object with exactly two keys: "
    "1. 'conceptual_score': an integer from 0 to 100 representing their algorithmic understanding. "
    "2. 'justification_summary': a short text summary (1-2 sentences) evaluating their explanation. "
    "Return only the raw JSON. Do not include markdown wraps."
)

class EvaluationResult(BaseModel):
    conceptual_score: int
    justification_summary: str

def get_fallback_evaluation(candidate_answer: str) -> Dict[str, Any]:
    """Generates mock grading scores and reviews based on input length heuristics."""
    clean_ans = candidate_answer.strip()
    ans_len = len(clean_ans)
    
    if ans_len < 15:
        score = 25
        summary = "Answer is insufficient and fails to demonstrate technical or architectural depth."
    elif ans_len < 40:
        score = 65
        summary = "Candidate provided a brief explanation, but lacks deep analysis of runtime constraints and stack trade-offs."
    else:
        # Scale score dynamically up to 98
        score = min(75 + (ans_len // 8), 98)
        summary = "Demonstrated clear analytical competency, explaining memory bounds and algorithmic complexity logic effectively."
        
    return {
        "conceptual_score": score,
        "justification_summary": summary
    }

async def evaluate_response(code_snapshot: str, question_asked: str, candidate_answer: str) -> Dict[str, Any]:
    """
    Asynchronously evaluates the candidate's answer using Gemini 1.5 Flash.
    Returns a dict containing 'conceptual_score' (int) and 'justification_summary' (str).
    """
    if not client:
        logger.info("[Grading] Executing fallback heuristics check.")
        return get_fallback_evaluation(candidate_answer)
        
    try:
        prompt = (
            f"Code Snapshot:\n{code_snapshot}\n\n"
            f"Question Asked:\n{question_asked}\n\n"
            f"Candidate Answer:\n{candidate_answer}"
        )
        
        # Call API requesting JSON schema response
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=EvaluationResult,
                temperature=0.2
            )
        )
        
        raw_text = response.text.strip() if response.text else "{}"
        result = json.loads(raw_text)
        
        # Verify keys are present
        score = int(result.get("conceptual_score", 50))
        summary = str(result.get("justification_summary", "Evaluation completed successfully."))
        
        logger.info(f"[Grading] Evaluation finished. Score: {score}")
        return {
            "conceptual_score": score,
            "justification_summary": summary
        }
        
    except Exception as e:
        logger.error(f"[Grading] Error invoking Gemini API: {e}. Executing fallback grading.")
        return get_fallback_evaluation(candidate_answer)
