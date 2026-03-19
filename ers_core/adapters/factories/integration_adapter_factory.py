from __future__ import annotations

from ers_core.adapters.providers.base import BaseHttpAdapter, BatchAdapter, DatabaseAdapter, WebhookAdapter
from ers_core.domain.models import IntegrationConfig


class IntegrationAdapterFactory:
    def create(self, integration: IntegrationConfig):
        if integration.provider_type.value == "IDENTITY":
            return BaseHttpAdapter()
        if integration.provider_type.value == "FINANCIAL":
            return BaseHttpAdapter()

        integration_kind = integration.settings.get("integrationKind")
        if integration_kind == "Webhook":
            return WebhookAdapter()
        if integration_kind == "Batch":
            return BatchAdapter()
        if integration_kind == "Base de datos":
            return DatabaseAdapter()
        return BaseHttpAdapter()

