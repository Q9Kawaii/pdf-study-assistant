"""Creates the one Gemini client that the whole app shares."""
import os

from dotenv import load_dotenv
from google import genai
from google.genai import errors, types

from config import GEMINI_TIMEOUT_MS

# Reads .env on your laptop. On Render, the real environment variable is used.
load_dotenv()

# With no key we keep client as None, so the API can explain the problem.
api_key = os.getenv("GEMINI_API_KEY")
client = None
if api_key:
    client = genai.Client(
        api_key=api_key,
        # Without a timeout, one stuck call would make a user wait forever.
        http_options=types.HttpOptions(timeout=GEMINI_TIMEOUT_MS),
    )


def hit_daily_limit(error: errors.APIError) -> bool:
    """True if Gemini's limit for the whole day is used up.

    A per-minute limit clears soon, so waiting helps. A daily limit lasts for
    hours, so waiting only makes the user sit there for nothing.
    """
    return error.code == 429 and "per day" in (error.message or "").lower()
