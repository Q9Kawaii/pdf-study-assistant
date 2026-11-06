"""Step 6 of the RAG pipeline: keep each upload's index in memory."""
import uuid
from threading import Lock

import numpy as np

from config import MAX_SESSIONS

# {session_id: {"chunks": [...], "vectors": matrix}}. This is our whole "vector
# database". It's wiped when the server restarts, which is fine for a demo.
sessions: dict[str, dict] = {}
lock = Lock()  # requests run in parallel threads, so changes take turns


def create_session(chunks: list[dict], vectors: np.ndarray) -> str:
    """Store an index and return its ID."""
    session_id = uuid.uuid4().hex  # random, so nobody can guess another user's ID
    with lock:
        # Dicts keep insertion order, so the first key is the oldest upload.
        if len(sessions) >= MAX_SESSIONS:
            sessions.pop(next(iter(sessions)))
        sessions[session_id] = {"chunks": chunks, "vectors": vectors}
    return session_id


def get_session(session_id: str) -> dict | None:
    """Return a stored index, or None if it has gone."""
    return sessions.get(session_id)
