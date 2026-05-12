from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from ers_core.application.ports.integration_repository import AuditLogRepository, RuleConfigRepository
from ers_core.domain.enums import AuditActionType, AuditResultType
from ers_core.domain.models import AuditLog, ConfiguredRule


class RuleConfigManager:
    def __init__(self, repository: RuleConfigRepository, audit_repository: AuditLogRepository) -> None:
        self._repository = repository
        self._audit_repository = audit_repository

    def list_rules(self) -> list[ConfiguredRule]:
        return self._repository.list_all()

    def create_rule(
        self,
        *,
        name: str,
        category: str,
        severity: str,
        status: str,
        source: str | None,
        description: str,
        rule_type: str,
        parameters: dict,
        updated_by: str | None,
    ) -> ConfiguredRule:
        now = datetime.utcnow()
        rule = ConfiguredRule(
            rule_id=f"RULE-{uuid4().hex[:8].upper()}",
            name=name.strip(),
            category=category.strip(),
            severity=severity.strip(),
            status=status.strip(),
            source=source.strip() if source else None,
            description=description.strip(),
            rule_type=rule_type.strip(),
            parameters=parameters,
            created_at=now,
            updated_at=now,
            updated_by=updated_by,
        )
        saved = self._repository.save(rule)
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-{uuid4().hex[:10].upper()}",
                action=AuditActionType.ADMIN_CONFIGURATION_CHANGED,
                result=AuditResultType.OK,
                entity_type="ConfiguredRule",
                entity_id=saved.rule_id,
                actor_id=updated_by,
                actor_role=None,
                correlation_id=saved.rule_id,
                detail=f"Configured rule {saved.name} created",
                metadata={
                    "ruleType": saved.rule_type,
                    "status": saved.status,
                    "severity": saved.severity,
                    "parameters": saved.parameters,
                },
            )
        )
        return saved
