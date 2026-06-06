from __future__ import annotations

from typing import Any

from ers_core.adapters.providers.base import ConnectivityTestableAdapter
from ers_core.domain.models import IntegrationConfig


class DemoProviderAdapter(ConnectivityTestableAdapter):
    def test_connectivity(self, integration: IntegrationConfig) -> dict[str, Any]:
        return {
            "success": integration.enabled,
            "statusCode": None,
            "latencyMs": 0,
            "message": "Demo provider local listo para uso interno.",
        }
