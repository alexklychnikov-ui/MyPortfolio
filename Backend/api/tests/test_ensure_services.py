import unittest

from app.services.portfolio_service import PortfolioService
from tests.fixtures.portfolio_facts import ACCEPTED_REPOS, SKILLS, candidate


class EnsureServicesTests(unittest.TestCase):
    def test_pipeline_keeps_validated_services(self):
        generated = {
            "skills": SKILLS,
            "services": [
                candidate(
                    "rag-pilot",
                    sources=["https://github.com/alexklychnikov-ui/MyPortfolio"],
                    evidence="LightRAG docs assistant pilot in portfolio stack",
                    title_ru="RAG-пилот",
                    title_en="RAG pilot",
                    # MyPortfolio readme mentions RAG? Use ContentForge? Use a repo with rag — fixture MyPortfolio says Docker.
                    # Point to a repo that exists; evidence is project-backed via FullCRM? Better LightRAG-less:
                )
            ],
        }
        # Fix source to a real fixture repo that can back RAG via keyword match on key + accepted list.
        generated["services"][0]["source_repositories"] = [
            "https://github.com/alexklychnikov-ui/ContentForge"
        ]
        generated["services"][0]["evidence_summary"] = "OpenAI content pipeline; RAG skill mixed"
        generated["services"][0]["evidence_type"] = "mixed"
        out, diag = PortfolioService._apply_services_pipeline(generated, ACCEPTED_REPOS)
        self.assertEqual(diag.get("validation_errors"), [])
        self.assertEqual(out["services"][0]["id"], "svc-rag-pilot")
        self.assertIn("price", out["services"][0])

    def test_empty_after_filter_fails_validation(self):
        generated = {"skills": SKILLS, "services": []}
        out, diag = PortfolioService._apply_services_pipeline(generated, ACCEPTED_REPOS)
        self.assertIn("empty_services", diag.get("validation_errors") or [])
        # Original empty list not replaced with invented filler
        self.assertEqual(out.get("services"), [])


if __name__ == "__main__":
    unittest.main()
