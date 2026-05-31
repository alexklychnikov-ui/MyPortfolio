import unittest

from app.services.github_client import GithubClient


class MockupPickerTests(unittest.TestCase):
    def test_pick_latest_mockup_by_filename(self):
        client = GithubClient()
        entries = [
            {"type": "file", "name": "mockup-20260530-120000.png", "download_url": "https://example.com/old.png"},
            {"type": "file", "name": "mockup-20260531-104213.png", "download_url": "https://example.com/new.png"},
            {"type": "file", "name": "notes.txt", "download_url": "https://example.com/notes.txt"},
        ]
        self.assertEqual(client._pick_mockup_url(entries), ("https://example.com/new.png", "mockup-20260531-104213.png"))

    def test_pick_mockup_returns_none_for_empty_dir(self):
        client = GithubClient()
        self.assertIsNone(client._pick_mockup_url([]))


if __name__ == "__main__":
    unittest.main()
