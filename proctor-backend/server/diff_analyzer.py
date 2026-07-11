import time
import logging
from typing import Dict, Any, Tuple

from .config import (
    PASTE_CHAR_THRESHOLD,
    PASTE_TIME_WINDOW_SEC,
    MACRO_SPEED_CHAR_PER_SEC,
    MACRO_CHAR_THRESHOLD,
)

logger = logging.getLogger("proctor-backend.diff_analyzer")

# In-memory tracking of code state per socket session ID
# Format: { sid: { "last_code": str, "last_time": float } }
diff_ledger: Dict[str, Dict[str, Any]] = {}

def clear_session_diff(sid: str) -> None:
    """Clears history parameters for a candidate session."""
    if sid in diff_ledger:
        del diff_ledger[sid]

def analyze_code_diff(sid: str, new_code: str) -> Tuple[bool, str]:
    """
    Statefully analyzes sequential code updates to intercept copy-pastes and macro automation.
    
    Returns:
        Tuple[bool, str]: (is_anomaly, infraction_type)
    """
    current_time = time.time()
    
    # Handshake / First code updates initialization
    if sid not in diff_ledger:
        diff_ledger[sid] = {
            "last_code": new_code,
            "last_time": current_time
        }
        return False, ""
    
    state = diff_ledger[sid]
    last_code = state["last_code"]
    last_time = state["last_time"]
    
    # Calculate differentials
    delta_len = len(new_code) - len(last_code)
    time_delta = current_time - last_time
    
    # Avoid zero-division and negative bounds
    if time_delta <= 0:
        time_delta = 0.001
        
    # Update state history
    state["last_code"] = new_code
    state["last_time"] = current_time
    
    # 1. Paste Interception: Delta exceeds threshold within specified time window
    if delta_len > PASTE_CHAR_THRESHOLD and time_delta <= PASTE_TIME_WINDOW_SEC:
        logger.warn(f"[Diff] Paste anomaly caught for {sid}: delta={delta_len} chars, time={time_delta:.2f}s")
        return True, "PASTE_ANOMALY"
        
    # 2. Keystroke Dynamics Filter: Character addition rate exceeding human thresholds
    # Human typing speeds rarely exceed 15-20 characters per second (approx 120 WPM).
    # If a block of characters exceeds the threshold in under 1 second, it represents a macro or clipboard insertion.
    if delta_len > MACRO_CHAR_THRESHOLD:
        chars_per_second = delta_len / time_delta
        if chars_per_second > MACRO_SPEED_CHAR_PER_SEC:
            logger.warn(
                f"[Diff] Cadence dynamics anomaly caught for {sid}: speed={chars_per_second:.1f} cps (delta={delta_len} chars)"
            )
            return True, "MACRO_INSERTION"
            
    return False, ""
