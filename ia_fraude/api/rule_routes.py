from __future__ import annotations

from fastapi import APIRouter, Depends

from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_rule_repository import FileRuleConfigRepository
from ers_core.application.services.rule_config_manager import RuleConfigManager
from ers_core.config.app_settings import get_settings
from ers_core.domain.models import ConfiguredRule
from .rule_schemas import ConfiguredRuleCreateRequest, ConfiguredRuleResponse
from .security import require_actor, require_roles

router = APIRouter(prefix="/admin/rules", tags=["admin-rules"])
settings = get_settings()

_repository = FileRuleConfigRepository(settings.data_dir / "configured_rules.json")
_audit_repository = FileAuditLogRepository(settings.data_dir / "audit_logs.jsonl")
_manager = RuleConfigManager(_repository, _audit_repository)


def _to_response(rule: ConfiguredRule) -> ConfiguredRuleResponse:
    return ConfiguredRuleResponse(
        id=rule.rule_id,
        name=rule.name,
        category=rule.category,
        severity=rule.severity,  # type: ignore[arg-type]
        status=rule.status,  # type: ignore[arg-type]
        source=rule.source,
        description=rule.description,
        ruleType=rule.rule_type,  # type: ignore[arg-type]
        parameters=rule.parameters,
        createdAt=rule.created_at.isoformat(),
        updatedAt=rule.updated_at.isoformat(),
        updatedBy=rule.updated_by,
    )


@router.get("", response_model=list[ConfiguredRuleResponse])
def list_rules(actor: dict[str, str | None] = Depends(require_actor)) -> list[ConfiguredRuleResponse]:
    require_roles(actor, {"Admin"})
    return [_to_response(item) for item in _manager.list_rules()]


@router.post("", response_model=ConfiguredRuleResponse, status_code=201)
def create_rule(
    payload: ConfiguredRuleCreateRequest,
    actor: dict[str, str | None] = Depends(require_actor),
) -> ConfiguredRuleResponse:
    require_roles(actor, {"Admin"})
    rule = _manager.create_rule(
        name=payload.name,
        category=payload.category,
        severity=payload.severity,
        status=payload.status,
        source=payload.source,
        description=payload.description,
        rule_type=payload.ruleType,
        parameters=payload.parameters.model_dump(),
        updated_by=actor.get("name") or actor.get("id"),
    )
    return _to_response(rule)
