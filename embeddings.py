"""Step 3 of the RAG pipeline: turn text into vectors (lists of numbers)."""
import numpy as np
from google.genai import types

from config import EMBED_BATCH_SIZE, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL


def embed_texts(client, texts: list[str], task_type: str) -> np.ndarray:
    """Return one vector per text, as a matrix with one row per text."""
    vectors = []
    # Sending 100 texts in one call uses far less quota than 100 calls.
    for start in range(0, len(texts), EMBED_BATCH_SIZE):
        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=texts[start : start + EMBED_BATCH_SIZE],
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )
        vectors.extend(embedding.values for embedding in response.embeddings)
    # float32 uses half the RAM of numpy's default, and is precise enough here.
    return np.array(vectors, dtype=np.float32)


def embed_chunks(client, chunks: list[dict]) -> np.ndarray:
    """Embed document chunks. The task type tunes vectors for being searched."""
    texts = [chunk["text"] for chunk in chunks]
    return embed_texts(client, texts, "RETRIEVAL_DOCUMENT")


def embed_question(client, question: str) -> np.ndarray:
    """Embed a question. The task type tunes the vector for searching."""
    return embed_texts(client, [question], "RETRIEVAL_QUERY")[0]
