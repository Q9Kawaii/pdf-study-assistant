"""All project settings in one place, so nothing is a magic number elsewhere."""

# Gemini models. gemini-2.5-flash-lite is closed to new API keys, so we use
# 3.5. To switch the chat model, this is the only line to change.
CHAT_MODEL = "gemini-3.5-flash-lite"
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768  # smaller than the 3072 default, and still accurate
# Gemini's free tier allows 100 embeddings a minute, and every text in a batch
# counts as one. So batches save network trips, not quota. Staying below 100
# leaves room for people's questions in the same minute.
EMBED_BATCH_SIZE = 90
EMBED_RETRIES = 3  # how many times to wait when the minute's limit is used up
EMBED_RETRY_WAIT_SECONDS = 30
QUESTION_RETRY_WAIT_SECONDS = 20  # 3 waits just outlast the one-minute limit
MAX_ANSWER_TOKENS = 1024  # caps answer length, which also protects the quota
GEMINI_TIMEOUT_MS = 30000  # give up on any single Gemini call after 30 seconds

# OCR, for pages that are pictures of text.
MIN_PAGE_TEXT_CHARS = 20  # less than this on a page with images means a scan
# Gemini's free tier allows 15 chat requests a minute, shared by all users. So
# an upload never makes more than 5, however many pages it has.
OCR_MAX_CALLS = 5
OCR_TOKENS_PER_PAGE = 2048  # plenty for one page of text
OCR_TIMEOUT_MS = 60000  # a call reading several pages needs longer than usual
OCR_RETRY_WAIT_SECONDS = 15
OCR_PASSES = 2  # one read, plus one more try for any page that came back empty

# RAG settings.
CHUNK_SIZE = 500  # characters per chunk
CHUNK_OVERLAP = 100  # characters shared by neighbouring chunks
TOP_K = 3  # how many chunks we send to the chat model

# Limits that protect the free quota and the server's small amount of RAM.
MAX_PDF_BYTES = 2 * 1024 * 1024  # 2 MB
MAX_PAGES = 20
MAX_CHUNKS = 180  # 2 batches, so the longest upload takes about a minute
MAX_SESSIONS = 50  # the oldest upload is dropped to make room for a new one
MAX_QUESTION_CHARS = 500
MAX_QUIZ_ANSWER_CHARS = 500
MAX_QUIZ_TEXT_CHARS = 1000  # the quiz question and its reference answer

# Rate limits, counted per IP address. /upload isn't free either: it embeds.
ASK_RATE_LIMIT = "5/minute;20/day"
UPLOAD_RATE_LIMIT = "5/minute;20/day"
GRADE_RATE_LIMIT = "10/minute"
# Gemini requests per day, across all users. Each embedded text counts as one.
# Gemini's free embedding limit is 1000 a day, so we stop a little before it.
DAILY_GEMINI_REQUEST_CAP = 900

# Only these websites may call the API from a browser.
ALLOWED_ORIGINS = ["https://q9kawaii.github.io"]
LOCALHOST_ORIGIN_REGEX = r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"
