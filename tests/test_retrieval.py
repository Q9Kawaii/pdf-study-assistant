import unittest

import numpy as np

from retrieval import cosine_similarities, top_indices


class CosineTests(unittest.TestCase):
    def test_known_angles(self):
        question = np.array([1.0, 0.0])
        chunks = np.array([[3.0, 0.0], [0.0, 2.0], [-1.0, 0.0]])
        np.testing.assert_allclose(
            cosine_similarities(question, chunks), [1.0, 0.0, -1.0]
        )

    def test_length_does_not_matter(self):
        question = np.array([1.0, 1.0])
        chunks = np.array([[1.0, 1.0], [100.0, 100.0]])
        scores = cosine_similarities(question, chunks)
        self.assertAlmostEqual(scores[0], scores[1])


class TopIndicesTests(unittest.TestCase):
    def test_best_scores_come_first(self):
        scores = np.array([0.1, 0.9, 0.5, 0.7])
        self.assertEqual(top_indices(scores, 3), [1, 3, 2])

    def test_fewer_chunks_than_k(self):
        self.assertEqual(top_indices(np.array([0.2]), 3), [0])


if __name__ == "__main__":
    unittest.main()
