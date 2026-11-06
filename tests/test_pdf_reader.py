import io
import unittest

from pypdf import PdfWriter

from config import MAX_PAGES
from pdf_reader import PdfError, extract_pages


def blank_pdf(pages: int) -> bytes:
    """Build a real PDF that has pages but no text."""
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=200, height=200)
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


class ExtractPagesTests(unittest.TestCase):
    def test_rejects_a_file_that_is_not_a_pdf(self):
        with self.assertRaisesRegex(PdfError, "isn't a PDF"):
            extract_pages(b"hello, I am a text file")

    def test_rejects_a_damaged_pdf(self):
        with self.assertRaisesRegex(PdfError, "damaged"):
            extract_pages(b"%PDF-1.7 this is not really a pdf")

    def test_rejects_too_many_pages(self):
        with self.assertRaisesRegex(PdfError, "too long"):
            extract_pages(blank_pdf(MAX_PAGES + 1))

    def test_rejects_a_pdf_with_no_text(self):
        with self.assertRaisesRegex(PdfError, "No text found"):
            extract_pages(blank_pdf(1))


if __name__ == "__main__":
    unittest.main()
