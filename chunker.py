"""Step 2 of the RAG pipeline: cut each page into small overlapping pieces."""
from config import CHUNK_OVERLAP, CHUNK_SIZE


def split_text(text: str) -> list[str]:
    """Cut text into pieces of about CHUNK_SIZE characters."""
    # PDFs are full of odd line breaks. This turns all whitespace into 1 space.
    text = " ".join(text.split())

    pieces = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        if end < len(text):
            # Prefer to stop at a space, so we don't cut a word in half.
            space = text.rfind(" ", end - 50, end)
            if space != -1:
                end = space
        pieces.append(text[start:end])
        if end == len(text):
            break
        # Step back so the next piece repeats the end of this one. An idea cut
        # in half at a boundary then still appears whole in one of the pieces.
        start = end - CHUNK_OVERLAP
        # Likewise, start on a fresh word. find() gives -1 if there's no space.
        space = text.find(" ", start, end)
        if space != -1:
            start = space + 1
    return pieces


def chunk_pages(pages: list[dict]) -> list[dict]:
    """Chunk every page. Each chunk remembers its page for citations."""
    chunks = []
    for page in pages:
        # We chunk one page at a time, so a chunk always has exactly one page.
        for text in split_text(page["text"]):
            chunks.append({"id": len(chunks), "page": page["page"], "text": text})
    return chunks
