import unittest

from app.services.readme_parser import (
    extract_first_readme_image,
    extract_readme_media,
    extract_readme_title,
)


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

    def test_extract_readme_media_from_links(self):
        readme = """
# Title
![Mockup](Docs/mockups/cover.png)
**Видео:** [demo-overview.mp4](Docs/demo/videos/demo-overview.mp4)
| [01-login.png](Docs/demo/screenshots/01-login.png) | Вход |
| [02-dashboard.png](Docs/demo/screenshots/02-dashboard.png) | Дашборд |
"""
        media = extract_readme_media(readme, "alexklychnikov-ui", "ContentForge", "main")
        self.assertEqual(len(media["videos"]), 1)
        self.assertTrue(media["videos"][0]["url"].endswith("Docs/demo/videos/demo-overview.mp4"))
        self.assertEqual(len(media["screenshots"]), 2)
        self.assertFalse(any("mockups" in item["url"] for item in media["screenshots"]))

    def test_extract_readme_media_personal_ai_coach_style(self):
        readme = """
![AI](Docs/Mockups/career_coach_mockup.png)
- [Работа дашборда](Docs/Videos/dashboard_demo.mp4)
- [Работа в Telegram](Docs/Videos/telegram_bot_demo.mp4)
| Онбординг | [01_onboarding.png](Docs/Screenshots/01_onboarding.png) |
"""
        media = extract_readme_media(readme, "alexklychnikov-ui", "PersonalAICoach", "main")
        self.assertEqual(len(media["videos"]), 2)
        self.assertEqual(media["videos"][0]["label"], "Работа дашборда")
        self.assertEqual(len(media["screenshots"]), 1)
        self.assertIn("01_onboarding.png", media["screenshots"][0]["url"])


if __name__ == "__main__":
    unittest.main()
