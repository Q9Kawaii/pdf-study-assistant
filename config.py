"""All project settings in one place, so nothing is a magic number elsewhere."""

# Gemini models. gemini-2.5-flash-lite is closed to new API keys, so we use
# 3.5. To switch the chat model, this is the only line to change.
CHAT_MODEL = "gemini-3.5-flash-lite"
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768  # smaller than the 3072 default, and still accurate
EMBED_BATCH_SIZE = 100  # the most texts Gemini accepts in one embedding call
MAX_ANSWER_TOKENS = 1024  # caps answer length, which also protects the quota

# RAG settings.
CHUNK_SIZE = 500  # characters per chunk
CHUNK_OVERLAP = 100  # characters shared by neighbouring chunks
TOP_K = 3  # how many chunks we send to the chat model

# Limits that protect the free quota and the server's small amount of RAM.
MAX_PDF_BYTES = 2 * 1024 * 1024  # 2 MB
MAX_PAGES = 20
MAX_CHUNKS = 200  # keeps one upload inside Gemini's per-minute embedding limit
MAX_SESSIONS = 50  # the oldest upload is dropped to make room for a new one
MAX_QUESTION_CHARS = 500
MAX_QUIZ_ANSWER_CHARS = 500
MAX_QUIZ_TEXT_CHARS = 1000  # the quiz question and its reference answer

# Rate limits, counted per IP address. /upload isn't free either: it embeds.
ASK_RATE_LIMIT = "5/minute;20/day"
UPLOAD_RATE_LIMIT = "5/minute;20/day"
GRADE_RATE_LIMIT = "10/minute"
DAILY_GEMINI_CALL_CAP = 300  # Gemini calls per day, across all users

# Only these websites may call the API from a browser.
ALLOWED_ORIGINS = ["https://q9kawaii.github.io"]
LOCALHOST_ORIGIN_REGEX = r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"
