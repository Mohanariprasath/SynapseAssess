import os
import logging

logger = logging.getLogger("proctor-backend.server")

# Try to parse and load .env file from the proctor-backend root relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
env_path = os.path.join(backend_root, ".env")

if os.path.exists(env_path):
    try:
        with open(env_path, "r") as f:
            for line in f:
                stripped = line.strip()
                if stripped and not stripped.startswith("#") and "=" in stripped:
                    key, val = stripped.split("=", 1)
                    if key.strip() == "GEMINI_API_KEY":
                        os.environ["GEMINI_API_KEY"] = val.strip().strip('"').strip("'")
        logger.info("[Core] Local .env environment configurations verified and loaded.")
    except Exception as err:
        logger.error(f"[Core] Error reading local .env file: {err}")
