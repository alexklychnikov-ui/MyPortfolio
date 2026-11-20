import unittest
from unittest.mock import AsyncMock, patch

from app.services.mockup_storage import materialize_project_mockups


class MockupStorageTests(unittest.TestCase):
    def test_private_repo_mockup_saved_to_public_data(self):
        async def run() -> None:
            generated = {
                "projects": [
                    {
                        "tag": "https://github.com/alexklychnikov-ui/LightRAG",
                    }
                ]
            }
            accepted = [
                {
                    "repo_url": "https://github.com/alexklychnikov-ui/LightRAG",
                    "owner": "alexklychnikov-ui",
                    "repo": "LightRAG",
                    "is_private": True,
                    "mockup_url": "https://raw.githubusercontent.com/alexklychnikov-ui/LightRAG/main/Docs/mockups/mockup.png?token=abc",
                    "mockup_name": "mockup.png",
                }
            ]

            with patch("app.services.mockup_storage.httpx.AsyncClient") as client_cls:
                client = AsyncMock()
                response = AsyncMock()
                response.status_code = 200
                response.content = b"png-bytes"
                client.get.return_value = response
                client.__aenter__.return_value = client
                client.__aexit__.return_value = None
                client_cls.return_value = client

                import tempfile
                from pathlib import Path

                with tempfile.TemporaryDirectory() as tmp:
                    result = await materialize_project_mockups(generated, accepted, tmp, {"Authorization": "Bearer x"})
                    image = result["projects"][0]["image"]
                    self.assertTrue(image.startswith("/data/project-mockups/"))
                    saved = Path(tmp) / "project-mockups" / "alexklychnikov-ui-lightrag.png"
                    self.assertTrue(saved.exists())
                    self.assertEqual(saved.read_bytes(), b"png-bytes")

        import asyncio

        asyncio.run(run())

    def test_existing_cover_not_overwritten_by_analyze(self):
        async def run() -> None:
            generated = {
                "projects": [
                    {
                        "tag": "https://github.com/alexklychnikov-ui/LightRAG",
                    }
                ]
            }
            accepted = [
                {
                    "repo_url": "https://github.com/alexklychnikov-ui/LightRAG",
                    "owner": "alexklychnikov-ui",
                    "repo": "LightRAG",
                    "mockup_url": "https://raw.githubusercontent.com/alexklychnikov-ui/LightRAG/main/Docs/mockups/new.png",
                    "mockup_name": "new.png",
                }
            ]

            with patch("app.services.mockup_storage.httpx.AsyncClient") as client_cls:
                client = AsyncMock()
                client.__aenter__.return_value = client
                client.__aexit__.return_value = None
                client_cls.return_value = client

                import tempfile
                from pathlib import Path

                with tempfile.TemporaryDirectory() as tmp:
                    target = Path(tmp) / "project-mockups" / "alexklychnikov-ui-lightrag.png"
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(b"keep-me")

                    result = await materialize_project_mockups(generated, accepted, tmp, {})
                    self.assertEqual(
                        result["projects"][0]["image"],
                        "/data/project-mockups/alexklychnikov-ui-lightrag.png",
                    )
                    self.assertEqual(target.read_bytes(), b"keep-me")
                    client.get.assert_not_called()

        import asyncio

        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
