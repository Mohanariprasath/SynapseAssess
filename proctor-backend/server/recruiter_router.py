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

@recruiter_router.get("/candidates")
async def get_all_candidates() -> List[Dict[str, Any]]:
    """Retrieves all candidate records dynamically synthesized from session ledger."""
    candidates_list = []
    
    for sid, state in session_ledger.items():
        warnings = state.get("warnings_count", 0)
        is_active = state.get("is_active_flag", True)
        is_finalized = state.get("is_finalized", False)
        
        if warnings >= 3:
            status = "Terminated"
        elif warnings > 0:
            status = "Flagged"
        elif is_finalized or not is_active:
            status = "Completed"
        else:
            status = "In Progress"

        scores = state.get("conceptual_scores", [])
        ai_score = round(sum(scores) / len(scores)) if scores else (90 if status == "Completed" else 75)
        
        risk_rating = state.get("risk_rating", "Low")
        candidate_name = state.get("candidate_name", f"Candidate-{sid[:6]}")
        role = state.get("role", "Software Engineer")
        date_str = state.get("date", "Today")

        candidates_list.append({
            "id": sid,
            "name": candidate_name,
            "role": role,
            "status": status,
            "aiScore": ai_score,
            "riskRating": risk_rating,
            "warnings": warnings,
            "date": date_str
        })
        
    return candidates_list

@recruiter_router.post("/candidates/sync")
async def sync_candidate_record(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Dynamically registers or updates candidate session details into session ledger."""
    sid = payload.get("id") or payload.get("sid") or f"cand-{len(session_ledger) + 1:03d}"
    
    if sid not in session_ledger:
        session_ledger[sid] = {
            "warnings_count": payload.get("warnings", 0),
            "last_received_timestamp": 0,
            "is_active_flag": False,
            "candidate_name": payload.get("name", "Anonymous Candidate"),
            "role": payload.get("role", "Software Engineer"),
            "anomalies": payload.get("anomalies", []),
            "conceptual_scores": [payload.get("aiScore", 85)],
            "justification_summaries": [],
            "risk_score": float(payload.get("warnings", 0) * 20),
            "risk_rating": payload.get("riskRating", "Low"),
            "is_finalized": True,
            "date": payload.get("date", "July 2026")
        }
    else:
        state = session_ledger[sid]
        if "name" in payload: state["candidate_name"] = payload["name"]
        if "role" in payload: state["role"] = payload["role"]
        if "warnings" in payload: state["warnings_count"] = payload["warnings"]
        if "riskRating" in payload: state["risk_rating"] = payload["riskRating"]
        if "aiScore" in payload: state["conceptual_scores"] = [payload["aiScore"]]

    return {"status": "synced", "id": sid}

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
