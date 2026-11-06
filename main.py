"""PDF Study Assistant API. Run locally with: uvicorn main:app --reload"""
import httpx
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.genai import errors
from pydantic import BaseModel
from slowapi.errors import RateLimitExceeded

from ai_client import client
from answering import NOT_FOUND, answer_question
from chunker import chunk_pages
from config import (
    ALLOWED_ORIGINS,
    ASK_RATE_LIMIT,
    GRADE_RATE_LIMIT,
    LOCALHOST_ORIGIN_REGEX,
    MAX_CHUNKS,
    MAX_PDF_BYTES,
    MAX_QUESTION_CHARS,
    MAX_QUIZ_ANSWER_CHARS,
    MAX_QUIZ_TEXT_CHARS,
    OCR_MAX_CALLS,
    UPLOAD_RATE_LIMIT,
)
from embeddings import embed_chunks, embed_question
from grading import grade_answer
from rate_limits import limiter, spend_daily_quota
from ocr import ocr_pages
from pdf_reader import PdfError, extract_pages
from retrieval import cosine_similarities, top_indices
from sessions import create_session, get_session

# How many numbers of the question's vector we send to the X-ray panel.
VECTOR_PREVIEW_SIZE = 24

app = FastAPI(title="PDF Study Assistant")
app.state.limiter = limiter


@app.middleware("http")
async def reject_huge_requests(request: Request, call_next):
    """Refuse oversized bodies from their size header, before reading them."""
    length = request.headers.get("content-length", "0")
    # The extra 64 KB leaves room for the form data wrapped around the PDF.
    if length.isdigit() and int(length) > MAX_PDF_BYTES + 64 * 1024:
        return JSONResponse(
            status_code=413,
            content={"detail": "That PDF is too big. The limit is 2 MB."},
        )
    return await call_next(request)


# CORS: browsers block a page on one site (GitHub Pages) from calling an API on
# another (Render) unless the API allows that site. Added last so that it wraps
# everything else, which keeps its headers on error responses too.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=LOCALHOST_ORIGIN_REGEX,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request: Request, error: RateLimitExceeded):
    """Replace slowapi's default error with a friendly message."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"You're going a bit fast (limit: {error.detail}). "
            "Please wait a little and try again."
        },
    )


@app.exception_handler(errors.APIError)
def gemini_error_handler(request: Request, error: errors.APIError):
    """Turn any Gemini failure into a message the user can understand."""
    # flush=True sends this to Render's logs right away, not when a buffer fills.
    print(f"Gemini error {error.code}: {error.message}", flush=True)
    if error.code == 429:
        return JSONResponse(
            status_code=429,
            content={"detail": "The AI is busy right now. Please try again in a minute."},
        )
    return JSONResponse(
        status_code=502,
        content={"detail": "The AI service had a problem. Please try again."},
    )


@app.exception_handler(httpx.HTTPError)
def network_error_handler(request: Request, error: httpx.HTTPError):
    """Handle the case where we can't reach Gemini at all."""
    print(f"Network error: {error}", flush=True)
    return JSONResponse(
        status_code=502,
        content={"detail": "Couldn't reach the AI service. Please try again."},
    )


class AskRequest(BaseModel):
    """The JSON body /ask expects. FastAPI rejects anything that doesn't match."""

    session_id: str
    question: str


class GradeRequest(BaseModel):
    """The JSON body /grade expects."""

    question: str
    reference_answer: str
    user_answer: str


def require_client():
    """Stop with a clear message if the server has no API key."""
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="The AI service isn't set up yet. Please try again later.",
        )


# UptimeRobot's free plan pings with HEAD, so /health must accept it as well.
# This does no real work and never calls Gemini, so it's always fast and free.
@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    """Quick check that the server is running."""
    return {"status": "ok"}


# A plain "def" (not "async def") makes FastAPI run this in a worker thread,
# so slow PDF parsing doesn't freeze the server for other users.
@app.post("/upload")
@limiter.limit(UPLOAD_RATE_LIMIT)  # slowapi needs the "request" argument below
def upload(request: Request, file: UploadFile = File(...)):
    """Build a searchable index from a PDF: extract, OCR, chunk, embed, store."""
    # Read one byte past the limit: if we get it, the file is too big.
    pdf_bytes = file.file.read(MAX_PDF_BYTES + 1)
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="That PDF is too big. The limit is 2 MB.")

    try:
        pages, image_pages = extract_pages(pdf_bytes)
    except PdfError as error:
        raise HTTPException(status_code=400, detail=str(error))

    # Pages that are pictures of text go through OCR. Normal pages skip this.
    unread_pages = []
    if image_pages:
        require_client()
        spend_daily_quota(min(len(image_pages), OCR_MAX_CALLS))
        ocr_results, unread_pages = ocr_pages(client, pdf_bytes, image_pages)
        pages = sorted(pages + ocr_results, key=lambda page: page["page"])

    if not pages:
        if unread_pages:
            raise HTTPException(
                status_code=502,
                detail="The AI couldn't read your pages. Please try again in a minute.",
            )
        raise HTTPException(status_code=400, detail="No readable text found in that PDF.")

    chunks = chunk_pages(pages)
    if len(chunks) > MAX_CHUNKS:
        raise HTTPException(
            status_code=400,
            detail="That PDF has too much text for this free demo. "
            "Please upload shorter notes.",
        )

    require_client()
    # Last check before spending quota, so rejected uploads aren't counted.
    spend_daily_quota(len(chunks))  # Gemini counts each chunk as one request
    vectors = embed_chunks(client, chunks)
    return {
        "session_id": create_session(chunks, vectors),
        "pages": len(pages),
        "chunks": len(chunks),
        "ocr_pages": len(image_pages) - len(unread_pages),  # all of these have text
        "unread_pages": unread_pages,
    }


@app.post("/ask")
@limiter.limit(ASK_RATE_LIMIT)
def ask(request: Request, body: AskRequest):
    """Answer a question from the PDF, and return the data behind the answer."""
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Please type a question.")
    if len(question) > MAX_QUESTION_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Please keep questions under {MAX_QUESTION_CHARS} characters.",
        )

    # Missing IDs are expected: memory is wiped whenever the server restarts.
    session = get_session(body.session_id)
    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Your PDF is no longer on the server. Please upload it again.",
        )

    require_client()
    spend_daily_quota(2)  # one embeds the question, one writes the answer

    # Retrieval: embed the question, score every chunk, keep the best ones.
    question_vector = embed_question(client, question)
    scores = cosine_similarities(question_vector, session["vectors"])
    chunks = session["chunks"]
    top_chunks = [
        {**chunks[index], "score": round(float(scores[index]), 4)}
        for index in top_indices(scores)
    ]

    # Generation: only the top chunks reach the chat model, never the whole PDF.
    answer = answer_question(client, question, top_chunks)
    found = answer != NOT_FOUND

    return {
        "answer": answer,
        "found": found,
        "sources": top_chunks if found else [],  # no answer means nothing to cite
        # Real data for the RAG X-ray panel, so the frontend fakes nothing.
        "xray": {
            "question": question,
            "vector_dimensions": len(question_vector),
            "vector_preview": [
                round(float(value), 4) for value in question_vector[:VECTOR_PREVIEW_SIZE]
            ],
            "scores": [
                {"id": chunk["id"], "page": chunk["page"], "score": round(float(score), 4)}
                for chunk, score in zip(chunks, scores)
            ],
            "top_chunks": top_chunks,
        },
    }


@app.post("/grade")
@limiter.limit(GRADE_RATE_LIMIT)
def grade(request: Request, body: GradeRequest):
    """Score one written quiz answer out of 10, with short feedback."""
    answer = body.user_answer.strip()
    if not answer:
        raise HTTPException(status_code=400, detail="Please write an answer first.")
    if len(answer) > MAX_QUIZ_ANSWER_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Please keep answers under {MAX_QUIZ_ANSWER_CHARS} characters.",
        )
    # These two come from the browser, so they could be anything. Capping them
    # stops people using this endpoint as a free way to send long AI prompts.
    if max(len(body.question), len(body.reference_answer)) > MAX_QUIZ_TEXT_CHARS:
        raise HTTPException(status_code=400, detail="That quiz question is too long.")

    require_client()
    spend_daily_quota(1)
    result = grade_answer(client, body.question, body.reference_answer, answer)
    return {"score": result.score, "feedback": result.feedback}
