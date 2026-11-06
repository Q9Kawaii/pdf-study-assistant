"""Creates the one Gemini client that the whole app shares."""
import os

from dotenv import load_dotenv
from google import genai

# Reads .env on your laptop. On Render, the real environment variable is used.
load_dotenv()

# With no key we keep client as None, so the API can explain the problem.
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None
