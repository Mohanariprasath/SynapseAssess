import time
import logging
from typing import Dict, Any, List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from pydantic import BaseModel

from .media_processor import save_media_chunk
from .diff_analyzer import analyze_code_diff, clear_session_diff
from .ai_orchestrator import generate_interview_challenge
from .grading_engine import evaluate_response
from .metrics_aggregator import calculate_session_metrics
from .config import MAX_WARNINGS_THRESHOLD

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("proctor-backend.stream_manager")

# Create FastAPI app
fastapi_app = FastAPI(
    title="SynapseAssess Proctoring Stream Ingestion Core",
    description="Real-time candidate telemetry and media stream receiver.",
    version="1.0.0"
)

# Open up CORS for frontend workspace access
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Socket.io ASGI server wrapper
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)
socket_app = socketio.ASGIApp(sio, fastapi_app)

# Persistent In-Memory State Ledger
class SessionState(BaseModel):
    warnings_count: int = 0
    last_received_timestamp: int
    is_active_flag: bool = True
    candidate_name: str = "Anonymous Candidate"
    screen_dimensions: Dict[str, int] = None
    anomalies: List[Dict[str, Any]] = []
    conceptual_scores: List[int] = []
    justification_summaries: List[str] = []
    risk_score: float = 0.0
    risk_rating: str = "Low"
    is_finalized: bool = False

session_ledger: Dict[str, Dict[str, Any]] = {}

@fastapi_app.get("/health")
async def health_check():
    """Service health state diagnostic endpoint."""
    return {
        "status": "online",
        "active_sockets_count": len(session_ledger),
        "timestamp": int(time.time() * 1000)
    }

@fastapi_app.get("/sessions")
async def get_session_ledger():
    """Retrieves the active global proctoring session ledger for analytics inspection."""
    return session_ledger

@fastapi_app.get("/sessions/{sid}")
async def get_session_by_id(sid: str):
    """Retrieves active telemetry data for a specific candidate session."""
    if sid not in session_ledger:
        return {"error": "Session ID not found in ledger."}
    return session_ledger[sid]

@fastapi_app.post("/sessions/{sid}/finalize")
async def finalize_session(sid: str):
    """Calculates final penalty risk metrics, locks active flags, and saves the candidate record."""
    if sid not in session_ledger:
        return {"error": "Session ID not found in ledger."}
        
    state = session_ledger[sid]
    if state.get("is_finalized", False):
        return state
        
    # Calculate final metrics using penalty matrix aggregator
    metrics = calculate_session_metrics(state)
    
    # Update and lock state
    state.update(metrics)
    state["is_active_flag"] = False
    state["is_finalized"] = True
    state["last_received_timestamp"] = int(time.time() * 1000)
    
    logger.info(f"[Core] Finalized session {sid}. Immutable record archived.")
    return state

# WebSocket Telemetry Channels

@sio.event
async def connect(sid: str, environ: Dict[str, Any], auth: Any = None) -> bool:
    """Ingests candidate handshakes and instantiates tracking structures in the ledger."""
    # Reset/Create candidate session metadata mapping
    session_ledger[sid] = {
        "warnings_count": 0,
        "last_received_timestamp": int(time.time() * 1000),
        "is_active_flag": True,
        "screen_dimensions": None,
        "anomalies": [],
        "conceptual_scores": [],
        "justification_summaries": [],
        "risk_score": 0.0,
        "risk_rating": "Low",
        "is_finalized": False
    }
    logger.info(f"[Socket] Secure handshake verified. Client connected: {sid}")
    return True

@sio.event
async def disconnect(sid: str) -> None:
    """Updates candidate state flags in the ledger upon session channel close."""
    if sid in session_ledger:
        session_ledger[sid]["is_active_flag"] = False
        session_ledger[sid]["last_received_timestamp"] = int(time.time() * 1000)
    clear_session_diff(sid)
    logger.warn(f"[Socket] Connection terminated: {sid}")

@sio.on("security_anomaly")
async def handle_security_anomaly(sid: str, data: Dict[str, Any]) -> None:
    """
    Asynchronously processes candidate security anomaly event notifications.
    Tallies infractions, filters metrics, and logs alerts to the console.
    """
    if sid not in session_ledger:
        logger.error(f"[Socket] Telemetry received for unregistered sid: {sid}")
        return

    anomaly_type = data.get("type", "UNKNOWN_VIOLATION")
    timestamp = data.get("timestamp", int(time.time() * 1000))
    details = data.get("details", "No telemetry payload attached.")

    # Update ledger aggregates
    session_ledger[sid]["warnings_count"] += 1
    session_ledger[sid]["last_received_timestamp"] = timestamp
    session_ledger[sid]["anomalies"].append({
        "type": anomaly_type,
        "timestamp": timestamp,
        "details": details
    })

    current_warnings = session_ledger[sid]["warnings_count"]
    logger.warn(
        f"[Telemetry] INFRACTION DETECTED | SID: {sid} | Event: {anomaly_type} | Warnings: {current_warnings}/3"
    )

    # Trigger automatic warning callback broadcast to student client if threshold exceeded
    if current_warnings >= MAX_WARNINGS_THRESHOLD:
        logger.error(f"[Telemetry] Security threshold exceeded for {sid}. Disqualifying candidate.")
        await sio.emit("session_disqualified", {"warnings": current_warnings}, room=sid)

@sio.on("code_update")
async def handle_code_update(sid: str, data: Dict[str, Any]) -> None:
    """
    Ingests debounced code buffer snapshots, runs differential analysis,
    and triggers AI proctored challenges upon paste anomalies.
    """
    if sid not in session_ledger:
        return
        
    session_ledger[sid]["last_received_timestamp"] = int(time.time() * 1000)
    code = data.get("code", "")
    code_length = len(code)
    
    # Analyze typing speed and character changes statefully
    is_anomaly, infraction_type = analyze_code_diff(sid, code)
    
    if is_anomaly:
        timestamp = int(time.time() * 1000)
        session_ledger[sid]["warnings_count"] += 1
        session_ledger[sid]["anomalies"].append({
            "type": infraction_type,
            "timestamp": timestamp,
            "details": f"Typing analysis detected: {infraction_type}"
        })
        
        current_warnings = session_ledger[sid]["warnings_count"]
        logger.warn(
            f"[Telemetry] AI INTERVENTION | SID: {sid} | Anomaly: {infraction_type} | Warnings: {current_warnings}/3"
        )
        
        # Invoke low-latency Gemini orchestrator asynchronously
        language = data.get("language", "javascript")
        try:
            ai_question = await generate_interview_challenge(code, language)
            
            # Broadcast high-priority intervention lock triggers to client
            logger.info(f"[Socket] Broadcasting intervention overlay triggers to client: {sid}")
            await sio.emit("ai_intervention_trigger", {"question": ai_question}, room=sid)
        except Exception as err:
            logger.error(f"[Socket] Failed to generate or emit AI challenge to {sid}: {err}")
            
        # Check overall threshold bounds
        if current_warnings >= MAX_WARNINGS_THRESHOLD:
            logger.error(f"[Telemetry] Security threshold exceeded for {sid}. Disqualifying candidate.")
            await sio.emit("session_disqualified", {"warnings": current_warnings}, room=sid)
    else:
        logger.info(f"[Telemetry] Code sync snapshot from {sid}. Length: {code_length} chars.")

@sio.on("screen_share_handshake")
async def handle_screen_share_handshake(sid: str, data: Dict[str, Any]) -> None:
    """Ingests candidate desktop dimensions to audit workspace setup."""
    if sid in session_ledger:
        width = data.get("width", 0)
        height = data.get("height", 0)
        session_ledger[sid]["screen_dimensions"] = {"width": width, "height": height}
        session_ledger[sid]["last_received_timestamp"] = int(time.time() * 1000)
        logger.info(f"[Telemetry] Screen sharing active for {sid} ({width}x{height})")

@sio.on("media_chunk")
async def handle_media_chunk(sid: str, data: Any) -> None:
    """
    Ingests high-throughput binary WebM video stream chunks.
    Routes chunk bytes to media_processor asset pipelines.
    """
    if not isinstance(data, bytes):
        logger.error(f"[Socket] Received non-binary payload on media_chunk from {sid}")
        return

    try:
        # Save recording chunk using binary buffer manager
        await save_media_chunk(sid, data)
    except Exception as err:
        logger.error(f"[Socket] Error processing binary chunk from {sid}: {err}")

@sio.on("submit_answer")
async def handle_submit_answer(sid: str, data: Dict[str, Any]) -> None:
    """
    Ingests candidate justification answers, evaluates understanding using Gemini,
    registers results to ledger, and releases the screen lockout trigger.
    """
    if sid not in session_ledger:
        logger.error(f"[Socket] Answer submitted for unregistered session {sid}")
        return
        
    question = data.get("question", "")
    answer = data.get("answer", "")
    code = data.get("code", "")
    
    logger.info(f"[Socket] Evaluating answer payload from {sid}...")
    
    try:
        # Call cognitive grading engine asynchronously
        evaluation = await evaluate_response(code, question, answer)
        score = evaluation.get("conceptual_score", 50)
        summary = evaluation.get("justification_summary", "")
        
        # Append results to candidate ledger
        session_ledger[sid]["conceptual_scores"].append(score)
        session_ledger[sid]["justification_summaries"].append(summary)
        session_ledger[sid]["last_received_timestamp"] = int(time.time() * 1000)
        
        logger.info(f"[Socket] Graded answer for {sid}: score {score}/100")
        
        # Broadcast release signal to client workspace to unlock Monaco editor
        await sio.emit(
            "ai_intervention_release",
            {
                "success": True,
                "conceptual_score": score,
                "justification_summary": summary
            },
            room=sid
        )
    except Exception as err:
        logger.error(f"[Socket] Error grading candidate answer for {sid}: {err}")
        # Fail-safe release to ensure client doesn't stay permanently locked on network dropouts
        await sio.emit("ai_intervention_release", {"success": True}, room=sid)
