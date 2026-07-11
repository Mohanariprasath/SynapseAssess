import pytest
from server.metrics_aggregator import calculate_session_metrics

def test_calculate_session_metrics_empty():
    session_state = {
        "anomalies": [],
        "conceptual_scores": []
    }
    metrics = calculate_session_metrics(session_state)
    assert metrics["risk_score"] == 0.0
    assert metrics["risk_rating"] == "Low"
    assert metrics["tab_switches"] == 0
    assert metrics["fullscreen_exits"] == 0
    assert metrics["look_aways"] == 0

def test_calculate_session_metrics_violations():
    session_state = {
        "anomalies": [
            {"type": "FOCUS_LOST", "timestamp": 1000},
            {"type": "TAB_SWITCH", "timestamp": 2000},
            {"type": "FULLSCREEN_DEVIATION", "timestamp": 3000},
            {"type": "LOOK_AWAY", "timestamp": 4000}
        ],
        "conceptual_scores": [80, 90]
    }
    # Calculation:
    # tab_switches = 2 (FOCUS_LOST, TAB_SWITCH) -> 15 * 2 = 30
    # fullscreen_exits = 1 (FULLSCREEN_DEVIATION) -> 30 * 1 = 30
    # look_aways = 1 (LOOK_AWAY) -> 5 * 1 = 5
    # avg_score = 85 -> ai_discrepancy = 15 -> 0.5 * 15 = 7.5
    # Total expected risk_score = 30 + 30 + 5 + 7.5 = 72.5 (High)
    metrics = calculate_session_metrics(session_state)
    assert metrics["tab_switches"] == 2
    assert metrics["fullscreen_exits"] == 1
    assert metrics["look_aways"] == 1
    assert metrics["risk_score"] == 72.5
    assert metrics["risk_rating"] == "High"
