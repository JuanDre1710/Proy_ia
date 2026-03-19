from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from typing import Any
from uuid import uuid4

from ers_core.application.ports.integration_repository import AuditLogRepository, IntegrationConfigRepository
from ers_core.domain.enums import (
    AuditActionType,
    AuditResultType,
    IntegrationStatus,
    ProviderType,
)
from ers_core.domain.models import AuditLog, IntegrationConfig


class IntegrationManager:
    """
    Coordinates runtime integration configuration without coupling business logic
    to a specific provider implementation.
    """

    def __init__(
        self,
        repository: IntegrationConfigRepository,
        audit_repository: AuditLogRepository,
        adapter_factory: Any,
    ) -> None:
        self._repository = repository
        self._audit_repository = audit_repository
        self._adapter_factory = adapter_factory

    def list_integrations(self) -> list[IntegrationConfig]:
        return self._repository.list_all()

    def list_active_integrations(self, provider_type: ProviderType | None = None) -> list[IntegrationConfig]:
        integrations = [
            item
            for item in self._repository.list_all()
            if item.enabled and item.status in {IntegrationStatus.ACTIVE, IntegrationStatus.DEGRADED}
        ]
        if provider_type is not None:
            integrations = [item for item in integrations if item.provider_type == provider_type]
        return integrations

    def get_integration(self, integration_id: str) -> IntegrationConfig | None:
        return self._repository.get_by_id(integration_id)

    def create_integration(
        self,
        *,
        code: str,
        provider_type: ProviderType,
        display_name: str,
        base_url: str | None,
        auth_type: str | None,
        secret_ref: str | None,
        timeout_ms: int,
        retries: int,
        status: IntegrationStatus,
        enabled: bool,
        metadata: dict[str, Any] | None,
        settings: dict[str, Any] | None,
        updated_by: str | None,
    ) -> IntegrationConfig:
        integration = IntegrationConfig(
            integration_id=f"INT-{uuid4().hex[:8].upper()}",
            provider_type=provider_type,
            provider_code=code,
            display_name=display_name,
            status=status,
            enabled=enabled,
            base_url=base_url,
            auth_type=auth_type,
            secret_ref=secret_ref,
            timeout_ms=timeout_ms,
            retries=retries,
            retry_policy={"maxAttempts": retries},
            settings=settings or {},
            metadata=metadata or {},
            updated_at=datetime.utcnow(),
            updated_by=updated_by,
        )
        saved = self._repository.save(integration)
        self._audit("INTEGRATION_CONFIGURATION_CHANGED", "OK", saved.integration_id, updated_by, "Integration created")
        return saved

    def update_integration(
        self,
        integration_id: str,
        *,
        code: str,
        provider_type: ProviderType,
        display_name: str,
        base_url: str | None,
        auth_type: str | None,
        secret_ref: str | None,
        timeout_ms: int,
        retries: int,
        status: IntegrationStatus,
        enabled: bool,
        metadata: dict[str, Any] | None,
        settings: dict[str, Any] | None,
        updated_by: str | None,
    ) -> IntegrationConfig:
        current = self._require(integration_id)
        updated = replace(
            current,
            provider_code=code,
            provider_type=provider_type,
            display_name=display_name,
            base_url=base_url,
            auth_type=auth_type,
            secret_ref=secret_ref,
            timeout_ms=timeout_ms,
            retries=retries,
            retry_policy={"maxAttempts": retries},
            status=status,
            enabled=enabled,
            metadata=metadata or {},
            settings=settings or {},
            updated_at=datetime.utcnow(),
            updated_by=updated_by,
        )
        saved = self._repository.save(updated)
        self._audit("INTEGRATION_CONFIGURATION_CHANGED", "OK", saved.integration_id, updated_by, "Integration updated")
        return saved

    def set_enabled(self, integration_id: str, enabled: bool, actor_id: str | None) -> IntegrationConfig:
        current = self._require(integration_id)
        next_status = current.status if enabled else IntegrationStatus.DISABLED
        updated = replace(
            current,
            enabled=enabled,
            status=next_status,
            updated_at=datetime.utcnow(),
            updated_by=actor_id,
        )
        saved = self._repository.save(updated)
        self._audit(
            "INTEGRATION_CONFIGURATION_CHANGED",
            "OK",
            saved.integration_id,
            actor_id,
            f"Integration {'enabled' if enabled else 'disabled'}",
        )
        return saved

    def delete_integration(self, integration_id: str, actor_id: str | None) -> bool:
        deleted = self._repository.delete(integration_id)
        self._audit(
            "INTEGRATION_CONFIGURATION_CHANGED",
            "OK" if deleted else "OBSERVED",
            integration_id,
            actor_id,
            "Integration deleted" if deleted else "Delete requested for missing integration",
        )
        return deleted

    def resolve_provider(self, integration_id: str) -> Any:
        integration = self._require(integration_id)
        return self._adapter_factory.create(integration)

    def test_connectivity(self, integration_id: str, actor_id: str | None) -> dict[str, Any]:
        integration = self._require(integration_id)
        adapter = self._adapter_factory.create(integration)
        result = adapter.test_connectivity(integration)

        new_status = (
            IntegrationStatus.ACTIVE
            if result["success"]
            else IntegrationStatus.DEGRADED if integration.enabled else IntegrationStatus.DISABLED
        )
        updated = replace(
            integration,
            status=new_status,
            metadata={
                **integration.metadata,
                "lastConnectivityTestAt": datetime.utcnow().isoformat(),
                "lastConnectivityTest": result,
            },
            updated_at=datetime.utcnow(),
            updated_by=actor_id,
        )
        self._repository.save(updated)
        self._audit(
            "INTEGRATION_CONFIGURATION_CHANGED",
            "OK" if result["success"] else "ERROR",
            integration_id,
            actor_id,
            "Integration connectivity test executed",
        )
        return result

    def _require(self, integration_id: str) -> IntegrationConfig:
        integration = self._repository.get_by_id(integration_id)
        if integration is None:
            raise KeyError(f"Integration '{integration_id}' was not found.")
        return integration

    def _audit(
        self,
        action: str,
        result: str,
        entity_id: str,
        actor_id: str | None,
        detail: str,
    ) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-{uuid4().hex[:10].upper()}",
                action=AuditActionType(action),
                result=AuditResultType(result),
                entity_type="IntegrationConfig",
                entity_id=entity_id,
                actor_id=actor_id,
                actor_role=None,
                correlation_id=None,
                detail=detail,
                metadata={},
            )
        )
