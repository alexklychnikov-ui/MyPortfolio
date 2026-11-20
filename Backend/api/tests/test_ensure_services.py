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

    def test_fallback_builds_one_per_repo_up_to_ten(self):
        accepted = [
            {
                "owner": "alexklychnikov-ui",
                "repo": "LightRAG",
                "repo_url": "https://github.com/alexklychnikov-ui/LightRAG",
                "description": "RAG knowledge base",
                "topics": ["rag", "openai"],
                "languages": ["Python"],
                "readme": "# База знаний с ответом в Telegram\n\nTelegram bot with LightRAG and FastAPI",
            },
            {
                "owner": "alexklychnikov-ui",
                "repo": "FullCRM",
                "repo_url": "https://github.com/alexklychnikov-ui/FullCRM",
                "description": "Modular CRM",
                "topics": ["crm"],
                "languages": ["Python", "TypeScript"],
                "readme": "# Модульная AI-CRM\n\nFastAPI CRM",
            },
            {
                "owner": "alexklychnikov-ui",
                "repo": "ContentForge",
                "repo_url": "https://github.com/alexklychnikov-ui/ContentForge",
                "description": "Content calendar",
                "topics": ["smm"],
                "languages": ["Python"],
                "readme": "# Контент-календарь\n\nAutopost",
            },
        ]
        out = PortfolioService._ensure_services_from_github({"services": []}, accepted)
        self.assertGreaterEqual(len(out["services"]), 3)
        self.assertLessEqual(len(out["services"]), 10)
        ids = [item["id"] for item in out["services"]]
        self.assertTrue(any("lightrag" in i for i in ids))
        self.assertTrue(any("fullcrm" in i for i in ids))
        self.assertTrue(any("contentforge" in i for i in ids))
        titles = " ".join(item["title"]["ru"] for item in out["services"])
        self.assertTrue("База знаний" in titles or "RAG" in titles or "LightRAG" in titles)


if __name__ == "__main__":
    unittest.main()
