"""Protects the free Gemini quota: per-IP rate limits and a global daily cap."""
from datetime import datetime, timezone
from threading import Lock

from fastapi import HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import DAILY_GEMINI_REQUEST_CAP


def get_client_ip(request: Request) -> str:
    """Find the user's IP, which is what rate limits are counted against."""
    # On Render every request arrives through a proxy, so the connection's IP
    # is the proxy's. This header holds the real user's IP. If it's missing,
    # all users share one limit, which is annoying but still protects the quota.
    return request.headers.get("true-client-ip") or get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)

# Counts today's Gemini requests from all users. Resets on a server restart.
daily_usage = {"date": "", "count": 0}
lock = Lock()  # requests run in parallel threads, so changes take turns


def spend_daily_quota(requests: int) -> None:
    """Count Gemini requests we're about to make, or refuse if over the cap."""
    today = datetime.now(timezone.utc).date().isoformat()
    with lock:
        if daily_usage["date"] != today:  # a new day, so start from zero
            daily_usage.update(date=today, count=0)
        if daily_usage["count"] + requests > DAILY_GEMINI_REQUEST_CAP:
            raise HTTPException(
                status_code=429,
                detail="This demo has used up today's free AI quota. "
                "Please come back tomorrow.",
            )
        daily_usage["count"] += requests
