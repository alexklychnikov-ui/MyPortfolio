import unittest

from app.services.readme_parser import extract_first_readme_image, extract_readme_title


class ReadmeParserTests(unittest.TestCase):
    def test_extract_readme_title_from_heading(self):
        readme = "# ContentForge (NODEX)\n\nSome description"
        self.assertEqual(extract_readme_title(readme), "ContentForge (NODEX)")

    def test_extract_readme_title_without_hash(self):
        readme = "FullCRM Platform\n\nDescription"
        self.assertEqual(extract_readme_title(readme), "FullCRM Platform")

    def test_extract_first_markdown_image(self):
        readme = "# Title\n\n![preview](./assets/mockup.png)\n\nMore text"
        result = extract_first_readme_image(readme, "alexklychnikov-ui", "ContentForge", "main")
        self.assertEqual(
            result,
            (
                "https://raw.githubusercontent.com/alexklychnikov-ui/ContentForge/main/assets/mockup.png",
                "mockup.png",
            ),
        )

    def test_extract_first_html_image(self):
        readme = '# Title\n\n<img src="https://example.com/cover.jpg" alt="cover" />'
        result = extract_first_readme_image(readme, "owner", "repo", "main")
        self.assertEqual(result, ("https://example.com/cover.jpg", "cover.jpg"))

    def test_extract_first_image_skips_data_urls(self):
        readme = "![x](data:image/png;base64,abc)\n\n![](https://example.com/ok.png)"
        result = extract_first_readme_image(readme, "owner", "repo", "main")
        self.assertEqual(result, ("https://example.com/ok.png", "ok.png"))

    def test_extract_first_image_returns_none_when_missing(self):
        self.assertIsNone(extract_first_readme_image("# Title only", "owner", "repo", "main"))


if __name__ == "__main__":
    unittest.main()
