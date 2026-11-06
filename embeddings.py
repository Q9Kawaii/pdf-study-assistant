"""Step 3 of the RAG pipeline: turn text into vectors (lists of numbers)."""
import time

import numpy as np
from google.genai import errors, types

from config import (
    EMBED_BATCH_SIZE,
    EMBED_RETRIES,
    EMBED_RETRY_WAIT_SECONDS,
    EMBEDDING_DIMENSIONS,
    EMBEDDING_MODEL,
)


def embed_texts(client, texts: list[str], task_type: str) -> np.ndarray:
    """Embed texts in one API call. Returns a matrix with one row per text."""
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=EMBEDDING_DIMENSIONS,
        ),
    )
    vectors = [embedding.values for embedding in response.embeddings]
    # float32 uses half the RAM of numpy's default, and is precise enough here.
    return np.array(vectors, dtype=np.float32)


def embed_batch_patiently(client, texts: list[str]) -> np.ndarray:
    """Embed one batch. If we hit the per-minute limit, wait and try again."""
    for _ in range(EMBED_RETRIES):
        try:
            return embed_texts(client, texts, "RETRIEVAL_DOCUMENT")
        except errors.APIError as error:
            if error.code != 429:
                raise  # only "too many requests" is worth waiting for
            time.sleep(EMBED_RETRY_WAIT_SECONDS)
    # Last try. If this fails too, the API's error handler tells the user.
    return embed_texts(client, texts, "RETRIEVAL_DOCUMENT")


def embed_chunks(client, chunks: list[dict]) -> np.ndarray:
    """Embed document chunks. The task type tunes vectors for being searched."""
    texts = [chunk["text"] for chunk in chunks]
    # Batches mean a few network trips instead of one per chunk.
    batches = [
        embed_batch_patiently(client, texts[start : start + EMBED_BATCH_SIZE])
        for start in range(0, len(texts), EMBED_BATCH_SIZE)
    ]
    return np.vstack(batches)


def embed_question(client, question: str) -> np.ndarray:
    """Embed a question. The task type tunes the vector for searching."""
    return embed_texts(client, [question], "RETRIEVAL_QUERY")[0]
