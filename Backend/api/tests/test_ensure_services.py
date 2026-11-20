import unittest

from app.services.portfolio_service import PortfolioService


class EnsureServicesTests(unittest.TestCase):
    def test_keeps_non_empty_services(self):
        generated = {
            "services": [
                {
                    "id": "svc-a",
                    "title": {"ru": "A", "en": "A"},
                    "description": {"ru": "d", "en": "d"},
                }
            ]
        }
        out = PortfolioService._ensure_services_from_github(generated, [])
        self.assertEqual(len(out["services"]), 1)
        self.assertEqual(out["services"][0]["id"], "svc-a")

    def test_fallback_builds_three_from_github_signals(self):
        accepted = [
            {
                "repo_url": "https://github.com/alexklychnikov-ui/LightRAG",
                "description": "RAG knowledge base",
                "topics": ["rag", "openai"],
                "languages": ["Python"],
                "readme": "Telegram bot with LightRAG and FastAPI",
            }
        ]
        out = PortfolioService._ensure_services_from_github({"services": []}, accepted)
        self.assertEqual(len(out["services"]), 3)
        ids = [item["id"] for item in out["services"]]
        self.assertEqual(ids, ["svc-telegram-bots", "svc-python-ai", "svc-integrations"])
        self.assertIn("RAG", out["services"][1]["title"]["ru"])


if __name__ == "__main__":
    unittest.main()
