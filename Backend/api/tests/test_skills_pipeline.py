import unittest
from types import SimpleNamespace

from app.core.skill_categories import SKILL_CATEGORIES, empty_skills_grouped
from app.schemas.analyze import AnalyzeResponseData, GeneratedProject, GeneratedService, GeneratedSkills, LocalizedText
from app.services.static_exporter import export_public_data
import tempfile
from pathlib import Path
import json


class SkillsPipelineTests(unittest.TestCase):
    def test_empty_skills_grouped_has_seven_categories(self):
        grouped = empty_skills_grouped()
        self.assertEqual(list(grouped.keys()), list(SKILL_CATEGORIES))
        self.assertEqual(len(grouped), 7)

    def test_generated_skills_schema_accepts_seven_categories(self):
        payload = AnalyzeResponseData(
            projects=[],
            services=[],
            skills=GeneratedSkills(
                languageRuntime=["Python"],
                aiLlm=["OpenAI API"],
                backend=["FastAPI"],
                botsIntegrations=["aiogram"],
                infrastructure=["Docker"],
                automation=["n8n"],
                devTools=["VS Code"],
            ),
        )
        dumped = payload.skills.model_dump()
        self.assertEqual(set(dumped.keys()), set(SKILL_CATEGORIES))

    def test_export_public_data_writes_seven_skill_keys(self):
        skill_rows = [
            SimpleNamespace(category="languageRuntime", name="Python"),
            SimpleNamespace(category="aiLlm", name="LangChain"),
            SimpleNamespace(category="backend", name="FastAPI"),
            SimpleNamespace(category="botsIntegrations", name="aiogram"),
            SimpleNamespace(category="infrastructure", name="Docker"),
            SimpleNamespace(category="automation", name="Make"),
            SimpleNamespace(category="devTools", name="Cursor AI"),
            SimpleNamespace(category="legacy", name="ignored"),
        ]

        with tempfile.TemporaryDirectory() as tmp_dir:
            export_public_data([], [], skill_rows, tmp_dir)
            skills_path = Path(tmp_dir) / "skills.json"
            skills = json.loads(skills_path.read_text(encoding="utf-8"))

        self.assertEqual(list(skills.keys()), list(SKILL_CATEGORIES))
        self.assertEqual(skills["languageRuntime"], ["Python"])
        self.assertEqual(skills["devTools"], ["Cursor AI"])
        self.assertNotIn("legacy", skills)
        self.assertNotIn("nocode", skills)


if __name__ == "__main__":
    unittest.main()
