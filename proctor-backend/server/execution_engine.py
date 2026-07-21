import subprocess
import tempfile
import time
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger("proctor-backend.execution_engine")

def run_javascript_code(user_code: str, test_input: str, time_limit_sec: float = 2.0) -> Dict[str, Any]:
    """
    Executes user JavaScript code against a given input string in an isolated Node.js subprocess.
    """
    # Harness template wrapping the solve(input) function call
    harness_code = f"""
const fs = require('fs');

try {{
    {user_code}

    const inputRaw = fs.readFileSync(0, 'utf-8').trim();
    let parsedInput = inputRaw;
    if (!isNaN(inputRaw) && inputRaw !== '') {{
        parsedInput = Number(inputRaw);
    }}

    let result;
    if (typeof solve === 'function') {{
        result = solve(parsedInput);
    }} else {{
        throw new Error("Function 'solve(input)' is not defined.");
    }}

    if (typeof result === 'object') {{
        console.log(JSON.stringify(result));
    }} else {{
        console.log(result);
    }}
}} catch (err) {{
    console.error("RUNTIME_ERROR: " + err.message);
    process.exit(1);
}}
"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as tmp:
        tmp.write(harness_code)
        tmp_path = tmp.name

    start_time = time.time()
    try:
        process = subprocess.run(
            ["node", tmp_path],
            input=str(test_input),
            text=True,
            capture_output=True,
            timeout=time_limit_sec
        )
        exec_time = (time.time() - start_time) * 1000

        if process.returncode != 0:
            err_msg = process.stderr.strip() or "Runtime execution error."
            return {
                "status": "RTE",
                "output": "",
                "error": err_msg.replace("RUNTIME_ERROR: ", ""),
                "exec_time_ms": round(exec_time, 2)
            }

        return {
            "status": "OK",
            "output": process.stdout.strip(),
            "error": None,
            "exec_time_ms": round(exec_time, 2)
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "TLE",
            "output": "",
            "error": "Time Limit Exceeded (execution exceeded 2.0 seconds timeout).",
            "exec_time_ms": round(time_limit_sec * 1000, 2)
        }
    except FileNotFoundError:
        # Node.js binary fallback: evaluate using python executor if node is unavailable
        logger.warning("[Execution] Node.js process missing on host. Falling back to Python sandbox runner.")
        return run_python_fallback(user_code, test_input, time_limit_sec)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def run_python_fallback(user_code: str, test_input: str, time_limit_sec: float = 2.0) -> Dict[str, Any]:
    """
    Fallback Python sandbox runner if node is absent in environment.
    """
    harness_code = f"""
import sys, json

try:
    {user_code}
    raw_in = sys.stdin.read().strip()
    try:
        val = int(raw_in) if raw_in.lstrip('-').isdigit() else raw_in
    except Exception:
        val = raw_in

    if 'solve' in locals() and callable(locals()['solve']):
        res = solve(val)
        if isinstance(res, (dict, list)):
            print(json.dumps(res))
        else:
            print(res)
    else:
        raise Exception("Function 'solve(input)' is not defined.")
except Exception as e:
    print(f"RUNTIME_ERROR: {{e}}", file=sys.stderr)
    sys.exit(1)
"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp:
        tmp.write(harness_code)
        tmp_path = tmp.name

    start_time = time.time()
    try:
        process = subprocess.run(
            ["python", tmp_path],
            input=str(test_input),
            text=True,
            capture_output=True,
            timeout=time_limit_sec
        )
        exec_time = (time.time() - start_time) * 1000

        if process.returncode != 0:
            return {
                "status": "RTE",
                "output": "",
                "error": process.stderr.strip().replace("RUNTIME_ERROR: ", ""),
                "exec_time_ms": round(exec_time, 2)
            }

        return {
            "status": "OK",
            "output": process.stdout.strip(),
            "error": None,
            "exec_time_ms": round(exec_time, 2)
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "TLE",
            "output": "",
            "error": "Time Limit Exceeded.",
            "exec_time_ms": round(time_limit_sec * 1000, 2)
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def evaluate_candidate_suite(
    user_code: str,
    language: str = "javascript",
    hidden_input: str = "100",
    hidden_output: str = "200"
) -> Dict[str, Any]:
    """
    Evaluates candidate code against sample public test cases and hidden test cases.
    Masks inputs and outputs for hidden test cases in the returned response payload.
    """
    # Define suite of test cases
    test_cases = [
        {"id": "sample_1", "input": "5", "expected": "10", "is_hidden": False},
        {"id": "sample_2", "input": "12", "expected": "24", "is_hidden": False},
        {"id": "hidden_1", "input": hidden_input if hidden_input else "100", "expected": hidden_output if hidden_output else "200", "is_hidden": True}
    ]

    results = []
    total_passed = 0

    for tc in test_cases:
        if language.lower() in ["python", "py"]:
            run_res = run_python_fallback(user_code, tc["input"])
        else:
            run_res = run_javascript_code(user_code, tc["input"])

        passed = (run_res["status"] == "OK") and (run_res["output"] == tc["expected"])
        if passed:
            total_passed += 1

        # Build sanitized result record
        record = {
            "id": tc["id"],
            "is_hidden": tc["is_hidden"],
            "passed": passed,
            "status": run_res["status"],
            "exec_time_ms": run_res["exec_time_ms"]
        }

        if not tc["is_hidden"]:
            record["input"] = tc["input"]
            record["expected"] = tc["expected"]
            record["user_output"] = run_res["output"]
            record["error"] = run_res["error"]
        else:
            # Mask hidden inputs/outputs to prevent client-side inspection
            record["input"] = "[HIDDEN_INPUT_MASKED]"
            record["expected"] = "[HIDDEN_EXPECTED_MASKED]"
            record["user_output"] = "[HIDDEN_RESULT_MASKED]"
            record["error"] = run_res["error"] if run_res["status"] != "OK" else None

        results.append(record)

    score_pct = round((total_passed / len(test_cases)) * 100, 2)

    return {
        "score_percentage": score_pct,
        "total_test_cases": len(test_cases),
        "passed_test_cases": total_passed,
        "all_passed": total_passed == len(test_cases),
        "results": results
    }
