import os

# Server configuration
PORT = int(os.environ.get("PORT", 3001))
HOST = os.environ.get("HOST", "0.0.0.0")

# Security threshold configurations
MAX_WARNINGS_THRESHOLD = 3
PASTE_CHAR_THRESHOLD = 200
PASTE_TIME_WINDOW_SEC = 2.0
MACRO_SPEED_CHAR_PER_SEC = 80.0
MACRO_CHAR_THRESHOLD = 50

# AI Configuration
GEMINI_MODEL_CHALLENGE = "gemini-1.5-flash"
GEMINI_MODEL_REPORT = "gemini-1.5-pro"
