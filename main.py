"""PDF Study Assistant API. Run locally with: uvicorn main:app --reload"""
import math

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from ai_client import client
from chunker import chunk_pages
from config import EMBED_BATCH_SIZE, MAX_CHUNKS, MAX_PDF_BYTES
from embeddings import embed_chunks
from pdf_reader import PdfError, extract_pages
from sessions import create_session

app = FastAPI(title="PDF Study Assistant")


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
def upload(request: Request, file: UploadFile = File(...)):
    """Build a searchable index from a PDF: extract, chunk, embed, store."""
    # Read one byte past the limit: if we get it, the file is too big.
    pdf_bytes = file.file.read(MAX_PDF_BYTES + 1)
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="That PDF is too big. The limit is 2 MB.")

    try:
        pages = extract_pages(pdf_bytes)
    except PdfError as error:
        raise HTTPException(status_code=400, detail=str(error))

    chunks = chunk_pages(pages)
    if len(chunks) > MAX_CHUNKS:
        raise HTTPException(
            status_code=400,
            detail="That PDF has too much text for this free demo. "
            "Please upload shorter notes.",
        )

    require_client()
    vectors = embed_chunks(client, chunks)
    return {
        "session_id": create_session(chunks, vectors),
        "pages": len(pages),
        "chunks": len(chunks),
    }
