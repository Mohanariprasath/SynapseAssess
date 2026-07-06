import os
import asyncio
import logging

logger = logging.getLogger("proctor-backend.media_processor")

def append_chunk_sync(file_path: str, chunk_data: bytes) -> None:
    """Appends binary chunk data synchronously to the video file."""
    with open(file_path, "ab") as f:
        f.write(chunk_data)

async def save_media_chunk(session_id: str, chunk_data: bytes) -> str:
    """
    Asynchronously registers and appends binary video chunks into the candidate recordings repository.
    Runs the blocking file I/O operations in a separate thread pool.
    """
    try:
        # Resolve target recording path relative to project backend root
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_root = os.path.dirname(current_dir)
        recordings_dir = os.path.join(backend_root, "recordings", session_id)
        
        # Ensure target directory structure is present
        os.makedirs(recordings_dir, exist_ok=True)
        
        file_path = os.path.join(recordings_dir, "session_video.webm")
        
        # Dispatch blocking I/O to thread executor to prevent event loop lag
        await asyncio.to_thread(append_chunk_sync, file_path, chunk_data)
        
        logger.info(f"[Media] Appended {len(chunk_data)} bytes to: {file_path}")
        return file_path
    except Exception as e:
        logger.error(f"[Media] Failed to write media chunk for session {session_id}: {e}")
        raise e
