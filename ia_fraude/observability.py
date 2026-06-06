from __future__ import annotations

import json
import logging
import time
from collections import defaultdict, deque
from typing import Any
from uuid import uuid4

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from ers_core.config.app_settings import AppSettings


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "event"):
            payload["event"] = getattr(record, "event")
        if hasattr(record, "extra"):
            payload.update(getattr(record, "extra"))
        return json.dumps(payload, ensure_ascii=True)


def configure_logging(settings: AppSettings) -> None:
    root = logging.getLogger()
    root.setLevel(getattr(logging, settings.log_level, logging.INFO))
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter() if settings.structured_logs else logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    root.handlers = [handler]


class RequestContextMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Any, logger: logging.Logger) -> None:
        super().__init__(app)
        self._logger = logger

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        request_id = request.headers.get("X-Request-Id", f"req-{uuid4().hex[:12]}")
        started = time.perf_counter()
        request.state.request_id = request_id
        try:
            response = await call_next(request)
        except Exception:
            self._logger.exception(
                "unhandled_request_error",
                extra={"event": "request_error", "extra": {"request_id": request_id, "path": request.url.path, "method": request.method}},
            )
            raise

        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        response.headers["X-Request-Id"] = request_id
        response.headers["X-Process-Time-Ms"] = str(elapsed_ms)
        self._logger.info(
            "request_completed",
            extra={
                "event": "request_completed",
                "extra": {
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "status_code": response.status_code,
                    "elapsed_ms": elapsed_ms,
                    "client_ip": request.client.host if request.client else None,
                },
            },
        )
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Any, *, max_requests: int, window_seconds: int) -> None:
        super().__init__(app)
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._buckets: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        key = f"{client_ip}:{path}"
        now = time.time()
        bucket = self._buckets[key]
        while bucket and now - bucket[0] > self._window_seconds:
            bucket.popleft()
        if len(bucket) >= self._max_requests:
            request_id = getattr(request.state, "request_id", f"req-{uuid4().hex[:12]}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "rate_limited",
                        "message": "Too many requests.",
                        "requestId": request_id,
                    }
                },
                headers={"X-Request-Id": request_id},
            )
        bucket.append(now)
        return await call_next(request)
