import time
import logging
from typing import Dict, Any, Tuple

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
    
    # 1. Paste Interception: >200 characters delta within a 2-second window
    if delta_len > 200 and time_delta <= 2.0:
        logger.warn(f"[Diff] Paste anomaly caught for {sid}: delta={delta_len} chars, time={time_delta:.2f}s")
        return True, "PASTE_ANOMALY"
        
    # 2. Keystroke Dynamics Filter: Character addition rate exceeding human thresholds
    # Human typing speeds rarely exceed 15-20 characters per second (approx 120 WPM).
    # If a block of >50 characters is inserted in under 1 second, it represents a macro or clipboard insertion.
    if delta_len > 50:
        chars_per_second = delta_len / time_delta
        if chars_per_second > 80.0:
            logger.warn(
                f"[Diff] Cadence dynamics anomaly caught for {sid}: speed={chars_per_second:.1f} cps (delta={delta_len} chars)"
            )
            return True, "MACRO_INSERTION"
            
    return False, ""
