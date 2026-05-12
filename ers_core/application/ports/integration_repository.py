from __future__ import annotations

from typing import Protocol

from ers_core.domain.models import AuditLog, ConfiguredRule, IntegrationConfig


class IntegrationConfigRepository(Protocol):
    def list_all(self) -> list[IntegrationConfig]:
        """Return all configured integrations."""

    def get_by_id(self, integration_id: str) -> IntegrationConfig | None:
        """Return a single integration if it exists."""

    def save(self, integration: IntegrationConfig) -> IntegrationConfig:
        """Create or update an integration."""

    def delete(self, integration_id: str) -> bool:
        """Delete an integration by id."""


class AuditLogRepository(Protocol):
    def append(self, audit_log: AuditLog) -> None:
        """Persist a single audit log entry."""

    def query(
        self,
        *,
        actor_id: str | None = None,
        actor_role: str | None = None,
        entity_id: str | None = None,
        action: str | None = None,
        result: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        page: int = 0,
        page_size: int = 20,
        sort_by: str = "timestamp",
        sort_direction: str = "desc",
    ) -> tuple[list[AuditLog], int]:
        """Return paginated audit logs."""


class RuleConfigRepository(Protocol):
    def list_all(self) -> list[ConfiguredRule]:
        """Return all configured rules."""

    def get_by_id(self, rule_id: str) -> ConfiguredRule | None:
        """Return a single configured rule if it exists."""

    def save(self, rule: ConfiguredRule) -> ConfiguredRule:
        """Create or update a configured rule."""
