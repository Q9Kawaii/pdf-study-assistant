"""Run all tests from the project root with: python -m unittest"""
import unittest

from chunker import chunk_pages, split_text
from config import CHUNK_SIZE


class SplitTextTests(unittest.TestCase):
    def test_short_text_is_one_chunk(self):
        self.assertEqual(split_text("hello   world\n"), ["hello world"])

    def test_chunks_stay_within_size(self):
        pieces = split_text("word " * 1000)
        self.assertGreater(len(pieces), 1)
        self.assertTrue(all(len(piece) <= CHUNK_SIZE for piece in pieces))

    def test_neighbouring_chunks_overlap(self):
        words = " ".join(str(number) for number in range(1000))
        first, second = split_text(words)[:2]
        self.assertIn(second[:20], first)

    def test_no_words_are_cut(self):
        words = [f"word{number}" for number in range(500)]
        for piece in split_text(" ".join(words)):
            self.assertTrue(set(piece.split()) <= set(words))

    def test_text_without_spaces_still_finishes(self):
        pieces = split_text("x" * 2000)
        self.assertEqual(max(len(piece) for piece in pieces), CHUNK_SIZE)

    def test_nothing_is_lost(self):
        words = " ".join(str(number) for number in range(1000))
        joined = " ".join(split_text(words))
        for number in range(1000):
            self.assertIn(str(number), joined)


class ChunkPagesTests(unittest.TestCase):
    def test_chunks_remember_their_page(self):
        pages = [{"page": 2, "text": "alpha"}, {"page": 5, "text": "beta"}]
        self.assertEqual(
            chunk_pages(pages),
            [
                {"id": 0, "page": 2, "text": "alpha"},
                {"id": 1, "page": 5, "text": "beta"},
            ],
        )


if __name__ == "__main__":
    unittest.main()
