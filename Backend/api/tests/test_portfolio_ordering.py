import unittest

from app.services.portfolio_service import PortfolioService


class PortfolioOrderingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = PortfolioService()

    def test_order_projects_by_input(self):
        generated = {
            "projects": [
                {"tag": "https://github.com/o/c"},
                {"tag": "https://github.com/o/a"},
                {"tag": "https://github.com/o/b"},
            ]
        }
        repositories = [
            "https://github.com/o/a",
            "https://github.com/o/b",
            "https://github.com/o/c",
        ]
        result = self.service._order_projects_by_input(generated, [], repositories)
        tags = [p["tag"] for p in result["projects"]]
        self.assertEqual(
            tags,
            [
                "https://github.com/o/a",
                "https://github.com/o/b",
                "https://github.com/o/c",
            ],
        )

    def test_normalize_project_tags_uses_input_order(self):
        generated = {"projects": [{"tag": "invalid"}]}
        repositories = ["https://github.com/o/a"]
        generated = self.service._order_projects_by_input(generated, [], repositories)
        generated = self.service._normalize_project_tags(generated, repositories)
        self.assertEqual(generated["projects"][0]["tag"], "https://github.com/o/a")

    def test_sanitize_empty_demo_url(self):
        generated = {
            "projects": [
                {"demoUrl": "", "image": "https://example.com/x.png"},
                {"demoUrl": "https://demo.example.com", "image": "x"},
            ]
        }
        result = self.service._sanitize_generated_projects(generated)
        self.assertNotIn("demoUrl", result["projects"][0])
        self.assertNotIn("image", result["projects"][0])
        self.assertEqual(result["projects"][1]["demoUrl"], "https://demo.example.com")


if __name__ == "__main__":
    unittest.main()
