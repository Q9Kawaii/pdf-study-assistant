"""Step 1 of the RAG pipeline: pull the text out of a PDF, page by page."""
import io

from pypdf import PdfReader

from config import MAX_PAGES, MIN_PAGE_TEXT_CHARS


class PdfError(ValueError):
    """A problem with the uploaded file. The message is safe to show the user."""


def extract_pages(pdf_bytes: bytes) -> tuple[list[dict], list[int]]:
    """Return (text pages, numbers of pages that need OCR).

    Text pages look like {"page": 1, "text": "..."}. A page needs OCR if it has
    pictures but almost no real text, which is what a scanned page looks like.
    """
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
        image_pages = []
        # start=1 because people count pages from 1, not 0.
        for number, page in enumerate(reader.pages, start=1):
            # extract_text() can return None for a page with no text, so use "".
            text = page.extract_text() or ""
            if len(text.strip()) >= MIN_PAGE_TEXT_CHARS:
                pages.append({"page": number, "text": text})
            elif len(page.images) > 0:
                image_pages.append(number)
            elif text.strip():
                pages.append({"page": number, "text": text})  # short, but real
    except PdfError:
        raise  # our own friendly messages pass straight through
    except Exception:
        # Broken files fail in many different ways, so we catch them all here.
        raise PdfError("Couldn't read that PDF. The file may be damaged.")

    if not pages and not image_pages:
        raise PdfError("No text found. This PDF looks empty.")
    return pages, image_pages
