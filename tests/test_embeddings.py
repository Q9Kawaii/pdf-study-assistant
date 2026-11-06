import unittest
from types import SimpleNamespace
from unittest.mock import patch

from google.genai import errors

from config import EMBED_BATCH_SIZE
from embeddings import embed_chunks, embed_question


class FakeEmbedder:
    """Fails with Gemini's 429 a set number of times, then works."""

    def __init__(self, failures):
        self.failures = failures
        self.batch_sizes = []
        self.models = self

    def embed_content(self, model, contents, config):
        if self.failures > 0:
            self.failures -= 1
            raise errors.APIError(429, {"error": {"message": "Quota", "status": "LIMIT"}})
        self.batch_sizes.append(len(contents))
        embedding = SimpleNamespace(values=[1.0, 0.0])
        return SimpleNamespace(embeddings=[embedding for _ in contents])


@patch("embeddings.time.sleep")
class EmbedChunksTests(unittest.TestCase):
    chunks = [{"text": "some text"} for _ in range(EMBED_BATCH_SIZE + 5)]

    def test_splits_chunks_into_batches_in_order(self, sleep):
        client = FakeEmbedder(failures=0)
        vectors = embed_chunks(client, self.chunks)
        self.assertEqual(client.batch_sizes, [EMBED_BATCH_SIZE, 5])
        self.assertEqual(len(vectors), len(self.chunks))
        sleep.assert_not_called()

    def test_waits_and_retries_when_the_minute_limit_is_hit(self, sleep):
        client = FakeEmbedder(failures=2)
        self.assertEqual(len(embed_chunks(client, self.chunks)), len(self.chunks))
        self.assertEqual(sleep.call_count, 2)

    def test_a_question_waits_for_the_minute_limit_too(self, sleep):
        client = FakeEmbedder(failures=1)
        self.assertEqual(len(embed_question(client, "Hi")), 2)
        sleep.assert_called_once()

    def test_gives_up_after_the_last_retry(self, sleep):
        client = FakeEmbedder(failures=99)
        with self.assertRaises(errors.APIError):
            embed_chunks(client, self.chunks)


if __name__ == "__main__":
    unittest.main()
