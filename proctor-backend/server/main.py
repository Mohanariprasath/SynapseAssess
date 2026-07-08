import sys
import os
import uvicorn

# Resolve Python search path so modules import correctly regardless of start directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from server.stream_manager import fastapi_app, socket_app
from server.recruiter_router import recruiter_router

# Mount recruiter router on the primary app canvas path
fastapi_app.include_router(recruiter_router)

if __name__ == "__main__":
    # Start the ASGI server wrapper hosting FastAPI and python-socketio on port 3001
    print("[Core] Launching SynapseAssess Proctoring Server Ingestion Hub...")
    uvicorn.run(
        "server.main:socket_app", 
        host="0.0.0.0", 
        port=3001, 
        reload=True
    )
