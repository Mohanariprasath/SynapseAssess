import logging
from typing import Dict, Any

logger = logging.getLogger("proctor-backend.metrics_aggregator")

def calculate_session_metrics(session_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Applies the production proctoring penalty matrix to telemetry logs:
    Risk Score = (15 * Tab Switches) + (30 * Fullscreen Exits) + (5 * Look-Away Flags) + (0.5 * AI Score Discrepancies)
    """
    anomalies = session_state.get("anomalies", [])
    
    # Calculate anomaly counts based on type mappings
    tab_switches = sum(1 for a in anomalies if a.get("type") in ["TAB_SWITCH", "FOCUS_LOST"])
    fullscreen_exits = sum(1 for a in anomalies if a.get("type") == "FULLSCREEN_DEVIATION")
    look_aways = sum(1 for a in anomalies if a.get("type") == "LOOK_AWAY")
    
    # AI Score Discrepancies (expected max score of 100 minus actual score)
    conceptual_scores = session_state.get("conceptual_scores", [])
    if conceptual_scores:
        avg_score = sum(conceptual_scores) / len(conceptual_scores)
        ai_discrepancy = 100.0 - avg_score
    else:
        avg_score = 0.0
        ai_discrepancy = 0.0  # Default to zero discrepancy if no challenge was submitted
        
    # Weighted Risk Score calculation
    risk_score = (15 * tab_switches) + (30 * fullscreen_exits) + (5 * look_aways) + (0.5 * ai_discrepancy)
    
    # Categorize Risk Rating
    if risk_score < 30.0:
        risk_rating = "Low"
    elif risk_score <= 70.0:
        risk_rating = "Medium"
    else:
        risk_rating = "High"
        
    logger.info(f"[Metrics] Computed Risk: {risk_score:.2f} ({risk_rating}). Tab={tab_switches}, FS={fullscreen_exits}, Look={look_aways}")
    
    return {
        "tab_switches": tab_switches,
        "fullscreen_exits": fullscreen_exits,
        "look_aways": look_aways,
        "average_conceptual_score": round(avg_score, 2),
        "ai_discrepancy": round(ai_discrepancy, 2),
        "risk_score": round(risk_score, 2),
        "risk_rating": risk_rating
    }
