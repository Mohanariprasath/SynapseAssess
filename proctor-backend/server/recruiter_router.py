import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from .stream_manager import session_ledger
from .report_generator import generate_candidate_summary

logger = logging.getLogger("proctor-backend.recruiter_router")

recruiter_router = APIRouter(
    prefix="/api/recruiter", 
    tags=["Recruiter Workspace Services"]
)

@recruiter_router.get("/sessions/{session_id}")
async def get_session_details(session_id: str) -> Dict[str, Any]:
    """Retrieves full candidate state ledger aggregates, warning logs, and justifications."""
    if session_id not in session_ledger:
        logger.error(f"[Recruiter API] Requested unregistered session: {session_id}")
        raise HTTPException(
            status_code=404, 
            detail="Candidate session ID not found in active proctoring ledger."
        )
    return session_ledger[session_id]

@recruiter_router.get("/sessions/{session_id}/timeline")
async def get_session_timeline(session_id: str) -> List[Dict[str, Any]]:
    """Filters, formats, and returns candidate anomaly logs chronologically by Unix timestamp."""
    if session_id not in session_ledger:
        logger.error(f"[Recruiter API] Requested timeline for unregistered session: {session_id}")
        raise HTTPException(
            status_code=404, 
            detail="Candidate session ID not found in active proctoring ledger."
        )
        
    session_state = session_ledger[session_id]
    anomalies = session_state.get("anomalies", [])
    
    # Sort anomalies chronologically based on occurrence timestamp
    sorted_anomalies = sorted(anomalies, key=lambda x: x.get("timestamp", 0))
    
    logger.info(f"[Recruiter API] Timeline queried for {session_id}. Returned {len(sorted_anomalies)} items.")
    return sorted_anomalies

@recruiter_router.get("/sessions/{session_id}/report")
async def get_session_report(session_id: str) -> Dict[str, Any]:
    """Synthesizes or returns the cached Gemini 1.5 Pro Executive assessment report."""
    if session_id not in session_ledger:
        logger.error(f"[Recruiter API] Requested report for unregistered session: {session_id}")
        raise HTTPException(
            status_code=404, 
            detail="Candidate session ID not found in active proctoring ledger."
        )
        
    session_state = session_ledger[session_id]
    
    # Return cached report if present to prevent redundant LLM API overhead
    if "executive_report" in session_state:
        logger.info(f"[Recruiter API] Returning cached report for {session_id}.")
        return session_state["executive_report"]
        
    # Generate new report using GenAI SDK
    report = await generate_candidate_summary(session_state)
    session_state["executive_report"] = report
    return report
