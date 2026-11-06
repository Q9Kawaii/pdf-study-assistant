"""Step 4 of the RAG pipeline: find the chunks closest to the question."""
import numpy as np

from config import TOP_K


def cosine_similarities(question: np.ndarray, chunks: np.ndarray) -> np.ndarray:
    """Score every chunk against the question, from -1 to 1. Higher is closer.

    cosine = (a . b) / (|a| * |b|). It compares the direction of two vectors
    and ignores their length, so a long chunk gets no unfair advantage.
    """
    dot_products = chunks @ question  # one dot product per chunk, all at once
    lengths = np.linalg.norm(chunks, axis=1) * np.linalg.norm(question)
    return dot_products / lengths


def top_indices(scores: np.ndarray, k: int = TOP_K) -> list[int]:
    """Return the positions of the k highest scores, best first."""
    # argsort sorts from low to high, so [::-1] flips it to high to low.
    return np.argsort(scores)[::-1][:k].tolist()
