"""Step 1 of the RAG pipeline: pull the text out of a PDF, page by page."""
import io

from pypdf import PdfReader

from config import MAX_PAGES


class PdfError(ValueError):
    """A problem with the uploaded file. The message is safe to show the user."""


def extract_pages(pdf_bytes: bytes) -> list[dict]:
    """Return [{"page": 1, "text": "..."}, ...], skipping pages with no text."""
    # Every real PDF starts with these bytes, so this catches renamed files.
    if not pdf_bytes.startswith(b"%PDF-"):
        raise PdfError("That file isn't a PDF. Please upload a .pdf file.")

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        if reader.is_encrypted:
            raise PdfError("That PDF is password protected. Please unlock it first.")

        # Check the page count first, so we never parse an oversized document.
        if len(reader.pages) > MAX_PAGES:
            raise PdfError(f"That PDF is too long. The limit is {MAX_PAGES} pages.")

        pages = []
        # start=1 because people count pages from 1, not 0.
        for number, page in enumerate(reader.pages, start=1):
            # extract_text() can return None for a page with no text, so use "".
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page": number, "text": text})
    except PdfError:
        raise  # our own friendly messages pass straight through
    except Exception:
        # Broken files fail in many different ways, so we catch them all here.
        raise PdfError("Couldn't read that PDF. The file may be damaged.")

    # Scanned PDFs are just pictures of pages, so they contain no text.
    if not pages:
        raise PdfError("No text found. This PDF may be scanned images.")
    return pages
