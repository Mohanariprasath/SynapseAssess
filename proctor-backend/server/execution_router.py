import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from .execution_engine import evaluate_candidate_suite

logger = logging.getLogger("proctor-backend.execution_router")

execution_router = APIRouter(
    prefix="/api",
    tags=["Code Compilation & Evaluation Services"]
)

class RunCodePayload(BaseModel):
    code: str
    language: Optional[str] = "javascript"
    exam_id: Optional[str] = None
    hidden_input: Optional[str] = "100"
    hidden_output: Optional[str] = "200"

@execution_router.post("/run-code")
async def run_code(payload: RunCodePayload) -> Dict[str, Any]:
    """
    Evaluates candidate submitted code in a server-side isolated sandbox process
    against public sample test cases and masked hidden test cases.
    """
    try:
        logger.info(f"[Execution API] Running candidate code payload for exam: {payload.exam_id}")
        evaluation = evaluate_candidate_suite(
            user_code=payload.code,
            language=payload.language or "javascript",
            hidden_input=payload.hidden_input or "100",
            hidden_output=payload.hidden_output or "200"
        )
        return evaluation
    except Exception as err:
        logger.error(f"[Execution API] Error executing candidate code: {err}")
        raise HTTPException(status_code=500, detail=f"Code execution engine error: {str(err)}")
