from __future__ import annotations

import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from ia_fraude.observability import RateLimitMiddleware


class RateLimitMiddlewareTests(unittest.TestCase):
    def test_rate_limit_blocks_after_threshold(self) -> None:
        app = FastAPI()
        app.add_middleware(RateLimitMiddleware, max_requests=2, window_seconds=60)

        @app.get("/ping")
        async def ping() -> dict[str, str]:
            return {"ok": "ok"}

        with TestClient(app) as client:
            self.assertEqual(200, client.get("/ping").status_code)
            self.assertEqual(200, client.get("/ping").status_code)
            blocked = client.get("/ping")

        self.assertEqual(429, blocked.status_code)
        self.assertEqual("rate_limited", blocked.json()["error"]["code"])


if __name__ == "__main__":
    unittest.main()
