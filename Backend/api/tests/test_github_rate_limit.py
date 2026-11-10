import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.github_client import (
    RATE_LIMIT_REASON_PREFIX,
    GithubClient,
    GithubRateLimitError,
)
from app.services.portfolio_service import PortfolioService


class GithubRateLimitHelpersTest(unittest.IsolatedAsyncioTestCase):
    def test_format_rate_limit_reason(self):
        reason = GithubClient._rate_limit_reason("2026-11-10T10:27:35+00:00")
        self.assertIn(RATE_LIMIT_REASON_PREFIX, reason)
        self.assertIn("2026-11-10T10:27:35+00:00", reason)

    async def test_wait_raises_when_reset_too_far(self):
        client = GithubClient(max_wait_seconds=30)
        http = AsyncMock()
        with patch.object(
            client,
            "_read_core_rate",
            AsyncMock(return_value=(0, 3600, "2026-11-10T12:00:00+00:00")),
        ):
            with self.assertRaises(GithubRateLimitError) as ctx:
                await client._wait_until_rate_available(http, needed=4)
        self.assertIn("exceeds max", str(ctx.exception))

    async def test_collect_many_marks_all_when_limited_upfront(self):
        client = GithubClient(max_wait_seconds=0)
        repos = [
            "https://github.com/alexklychnikov-ui/ContentForge",
            "https://github.com/alexklychnikov-ui/FullCRM",
        ]

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "resources": {"core": {"remaining": 0, "reset": 1_794_321_413}}
        }

        mock_http = AsyncMock()
        mock_http.get = AsyncMock(return_value=mock_response)
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=None)

        with (
            patch.object(client, "_headers_for_requests", AsyncMock(return_value={})),
            patch("app.services.github_client.httpx.AsyncClient", return_value=mock_http),
        ):
            accepted, skipped = await client.collect_many(repos)

        self.assertEqual(accepted, [])
        self.assertEqual(len(skipped), 2)
        self.assertTrue(all(RATE_LIMIT_REASON_PREFIX in item["reason"] for item in skipped))


class PortfolioServiceRateLimitGuardTest(unittest.TestCase):
    def test_abort_on_rate_limit_skips(self):
        skipped = [
            {"url": "https://github.com/a/b", "reason": f"{RATE_LIMIT_REASON_PREFIX} (reset at x)"},
            {"url": "https://github.com/c/d", "reason": "Repository is not accessible"},
        ]
        hits = PortfolioService._rate_limit_skips(skipped)
        self.assertEqual(len(hits), 1)


if __name__ == "__main__":
    unittest.main()
