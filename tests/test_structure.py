import unittest

from scripts.gen_structure import FILES, STEPS, ALL_STEPS, CATEGORIES, out_of_date


class StructureTests(unittest.TestCase):
    def test_readme_and_page_match_the_repo(self):
        # This also fails if a file has no description, or a description no file.
        self.assertEqual(out_of_date(), [])

    def test_every_entry_uses_a_known_category_and_step(self):
        for path, (category, step, role, why) in FILES.items():
            self.assertIn(category, CATEGORIES, path)
            self.assertIn(step, STEPS + [ALL_STEPS], path)
            self.assertTrue(role and why, path)


if __name__ == "__main__":
    unittest.main()
