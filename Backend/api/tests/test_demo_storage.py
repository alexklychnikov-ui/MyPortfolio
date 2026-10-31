import asyncio
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from app.services.demo_storage import cleanup_orphan_project_demos, materialize_project_demos


class DemoStorageTests(unittest.TestCase):
    def test_downloads_demos_and_rewrites_local_urls(self):
        async def run() -> None:
            generated = {
                "projects": [
                    {"tag": "https://github.com/alexklychnikov-ui/ContentForge"},
                ]
            }
            accepted = [
                {
                    "repo_url": "https://github.com/alexklychnikov-ui/ContentForge",
                    "owner": "alexklychnikov-ui",
                    "repo": "ContentForge",
                    "screenshots": [
                        {
                            "url": "https://raw.githubusercontent.com/alexklychnikov-ui/ContentForge/main/Docs/demo/screenshots/01-login.png",
                            "label": "Вход",
                        }
                    ],
                    "videos": [
                        {
                            "url": "https://raw.githubusercontent.com/alexklychnikov-ui/ContentForge/main/Docs/demo/videos/demo.mp4",
                            "label": "Обзор",
                        }
                    ],
                }
            ]

            with patch("app.services.demo_storage.httpx.AsyncClient") as client_cls:
                client = AsyncMock()
                response = AsyncMock()
                response.status_code = 200
                response.content = b"file-bytes"
                client.get.return_value = response
                client.__aenter__.return_value = client
                client.__aexit__.return_value = None
                client_cls.return_value = client

                with tempfile.TemporaryDirectory() as tmp:
                    result = await materialize_project_demos(
                        generated, accepted, tmp, {"Authorization": "Bearer x"}
                    )
                    project = result["projects"][0]
                    self.assertEqual(len(project["screenshots"]), 1)
                    self.assertTrue(project["screenshots"][0]["url"].startswith("/data/project-demos/"))
                    self.assertEqual(project["screenshots"][0]["label"], "Вход")
                    self.assertTrue(project["videos"][0]["url"].startswith("/data/project-demos/"))
                    shot = Path(tmp) / "project-demos" / "alexklychnikov-ui-contentforge" / "screenshots"
                    self.assertTrue(any(shot.iterdir()))

        asyncio.run(run())

    def test_no_media_clears_fields_and_folder(self):
        async def run() -> None:
            with tempfile.TemporaryDirectory() as tmp:
                slug_dir = Path(tmp) / "project-demos" / "alexklychnikov-ui-oldrepo"
                (slug_dir / "screenshots").mkdir(parents=True)
                (slug_dir / "screenshots" / "01.png").write_bytes(b"x")

                generated = {
                    "projects": [
                        {"tag": "https://github.com/alexklychnikov-ui/OldRepo"},
                    ]
                }
                accepted = [
                    {
                        "repo_url": "https://github.com/alexklychnikov-ui/OldRepo",
                        "owner": "alexklychnikov-ui",
                        "repo": "OldRepo",
                        "screenshots": [],
                        "videos": [],
                    }
                ]

                with patch("app.services.demo_storage.httpx.AsyncClient") as client_cls:
                    client = AsyncMock()
                    client.__aenter__.return_value = client
                    client.__aexit__.return_value = None
                    client_cls.return_value = client
                    result = await materialize_project_demos(generated, accepted, tmp, {})

                self.assertNotIn("screenshots", result["projects"][0])
                self.assertNotIn("videos", result["projects"][0])
                self.assertFalse(slug_dir.exists())

        asyncio.run(run())

    def test_cleanup_orphan_demos_removes_missing_projects(self):
        with tempfile.TemporaryDirectory() as tmp:
            keep = Path(tmp) / "project-demos" / "keep-me"
            drop = Path(tmp) / "project-demos" / "drop-me"
            keep.mkdir(parents=True)
            drop.mkdir(parents=True)
            (drop / "x.png").write_bytes(b"1")
            cleanup_orphan_project_demos(tmp, {"keep-me"})
            self.assertTrue(keep.exists())
            self.assertFalse(drop.exists())


if __name__ == "__main__":
    unittest.main()
