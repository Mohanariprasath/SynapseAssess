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

# Validate loaded configuration
gemini_key = os.environ.get("GEMINI_API_KEY")
if not gemini_key:
    logger.warning("[Core] WARNING: GEMINI_API_KEY is not set. Real-time AI grading and questions will run in fallback mock mode.")
elif len(gemini_key) < 10:
    logger.warning("[Core] WARNING: GEMINI_API_KEY appears too short to be valid. Please inspect your configuration.")
else:
    logger.info("[Core] Environment validated: GEMINI_API_KEY is present.")

