from __future__ import annotations

from abc import ABC, abstractmethod
from time import perf_counter
from typing import Any
from urllib.parse import urlparse

import requests

from ers_core.domain.models import IntegrationConfig


class ConnectivityTestableAdapter(ABC):
    @abstractmethod
    def test_connectivity(self, integration: IntegrationConfig) -> dict[str, Any]:
        """Execute a basic, non-business connectivity test."""


class BaseHttpAdapter(ConnectivityTestableAdapter):
    def test_connectivity(self, integration: IntegrationConfig) -> dict[str, Any]:
        if not integration.base_url:
            return {
                "success": False,
                "statusCode": None,
                "latencyMs": None,
                "message": "Integration has no base URL configured.",
            }

        parsed = urlparse(integration.base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            return {
                "success": False,
                "statusCode": None,
                "latencyMs": None,
                "message": "Base URL is invalid for HTTP connectivity tests.",
            }

        started = perf_counter()
        try:
            response = requests.head(
                integration.base_url,
                timeout=max(integration.timeout_ms / 1000, 1),
                allow_redirects=True,
            )
            latency_ms = int((perf_counter() - started) * 1000)
            return {
                "success": response.ok,
                "statusCode": response.status_code,
                "latencyMs": latency_ms,
                "message": "Connectivity test completed.",
            }
        except requests.RequestException as exc:
            latency_ms = int((perf_counter() - started) * 1000)
            return {
                "success": False,
                "statusCode": None,
                "latencyMs": latency_ms,
                "message": str(exc),
            }


class WebhookAdapter(BaseHttpAdapter):
    pass


class BatchAdapter(ConnectivityTestableAdapter):
    def test_connectivity(self, integration: IntegrationConfig) -> dict[str, Any]:
        return {
            "success": integration.enabled,
            "statusCode": None,
            "latencyMs": 0,
            "message": "Batch integrations expose configuration-only validation in this sprint.",
        }


class DatabaseAdapter(ConnectivityTestableAdapter):
    def test_connectivity(self, integration: IntegrationConfig) -> dict[str, Any]:
        return {
            "success": bool(integration.base_url or integration.secret_ref),
            "statusCode": None,
            "latencyMs": 0,
            "message": "Database integrations are validated by configuration presence in this sprint.",
        }

