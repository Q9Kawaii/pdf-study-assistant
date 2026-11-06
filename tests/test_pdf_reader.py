import io
import unittest

from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, NumberObject, StreamObject

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


def pdf_with_image() -> bytes:
    """Build a real PDF whose only page holds a tiny image and no text."""
    writer = PdfWriter()
    page = writer.add_blank_page(width=200, height=200)
    image = StreamObject()
    image.set_data(b"\xff\x00\x00")
    image.update(
        {
            NameObject("/Type"): NameObject("/XObject"),
            NameObject("/Subtype"): NameObject("/Image"),
            NameObject("/Width"): NumberObject(1),
            NameObject("/Height"): NumberObject(1),
            NameObject("/ColorSpace"): NameObject("/DeviceRGB"),
            NameObject("/BitsPerComponent"): NumberObject(8),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {
            NameObject("/XObject"): DictionaryObject(
                {NameObject("/Im0"): writer._add_object(image)}
            )
        }
    )
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

    def test_finds_pages_that_need_ocr(self):
        pdf = pdf_with_image()
        self.assertEqual(extract_pages(pdf), ([], [1]))


if __name__ == "__main__":
    unittest.main()
