import unittest

from app.services.readme_parser import upsert_first_readme_image


class ReadmeImageUpsertTests(unittest.TestCase):
    def test_replace_existing_markdown_image(self):
        readme = "# Title\n\n![Old](./old.png)\n\nBody"
        updated, replaced = upsert_first_readme_image(readme, "docs/mockups/new.png")
        self.assertTrue(replaced)
        self.assertIn("![Mockup](docs/mockups/new.png)", updated)
        self.assertNotIn("old.png", updated)

    def test_insert_after_title_when_missing(self):
        readme = "# Product\n\nDescription"
        updated, replaced = upsert_first_readme_image(readme, "docs/mockups/new.png")
        self.assertFalse(replaced)
        self.assertIn("![Mockup](docs/mockups/new.png)", updated)
        self.assertTrue(updated.index("![Mockup]") > updated.index("# Product"))


if __name__ == "__main__":
    unittest.main()
