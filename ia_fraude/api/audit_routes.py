from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends

from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.config.app_settings import get_settings
from ers_core.domain.enums import AuditActionType, AuditResultType
from ers_core.domain.models import AuditLog
from .audit_schemas import (
    AuditCaseTimelineDto,
    AuditCaseTimelineRowDto,
    AuditEventRequestDto,
    AuditLogPageDto,
    AuditLogRowDto,
)
from .security import require_actor, require_roles

router = APIRouter(prefix="/audit", tags=["audit"])
settings = get_settings()

_repository = FileAuditLogRepository(settings.data_dir / "audit_logs.jsonl")


def _map_role(value: str | None) -> str:
    if value == "Admin":
        return "Administrador"
    if value == "Supervisor":
        return "Supervisor"
    if value == "Evaluador":
        return "Evaluador de Riesgos"
    return "Sistema"


def _map_action(value: str) -> str:
    mapping = {
        "AUTH_LOGIN": "Login",
        "AUTH_LOGOUT": "Logout",
        "CASE_CREATED": "Consulta de riesgo",
        "CASE_VALIDATED": "Consulta de riesgo",
        "CASE_EVALUATED": "Consulta de riesgo",
        "CASE_DECISION_RECORDED": "Revision manual",
        "ADMIN_CONFIGURATION_CHANGED": "Cambio de parametros",
        "INTEGRATION_CONFIGURATION_CHANGED": "Cambio de parametros",
        "HARD_RULES_EXECUTED": "Consulta de riesgo",
        "REASONING_EXECUTED": "Consulta de riesgo",
        "SCORING_EXECUTED": "Consulta de riesgo",
        "FINAL_ASSESSMENT_GENERATED": "Consulta de riesgo",
        "INTEGRATION_CONSUMED": "Consulta de riesgo",
    }
    return mapping.get(value, value)


def _map_result(value: str) -> str:
    mapping = {"OK": "OK", "OBSERVED": "Observado", "BLOCKED": "Bloqueado", "ERROR": "Error"}
    return mapping.get(value, value)


def _map_stage(value: str) -> str:
    mapping = {
        "CASE_CREATED": "Creacion del caso",
        "CASE_VALIDATED": "Validacion",
        "CASE_EVALUATED": "Consolidacion",
        "INTEGRATION_CONSUMED": "Enriquecimiento",
        "HARD_RULES_EXECUTED": "Reglas disparadas",
        "REASONING_EXECUTED": "Reasoning ejecutado",
        "SCORING_EXECUTED": "Scoring ejecutado",
        "FINAL_ASSESSMENT_GENERATED": "Evaluacion final",
        "CASE_DECISION_RECORDED": "Resolucion manual",
        "EXPORT_REQUESTED": "Exportacion",
        "AUTH_LOGIN": "Autenticacion",
        "AUTH_LOGOUT": "Autenticacion",
        "ADMIN_CONFIGURATION_CHANGED": "Administracion",
        "INTEGRATION_CONFIGURATION_CHANGED": "Administracion",
    }
    return mapping.get(value, value)


@router.get("/logs", response_model=AuditLogPageDto)
def get_audit_logs(
    usuario: str = "",
    rol: str = "",
    fechaDesde: str = "",
    fechaHasta: str = "",
    accion: str = "",
    resultado: str = "",
    identificadorConsultado: str = "",
    page: int = 0,
    pageSize: int = 10,
    sortBy: str = "fechaHora",
    sortDirection: str = "desc",
    actor: dict[str, str | None] = Depends(require_actor),
) -> AuditLogPageDto:
    require_roles(actor, {"Admin", "Supervisor"})
    export_format_filter = "csv" if accion == "Exportacion CSV" else "pdf" if accion == "Exportacion PDF" else ""
    risk_action_filter = accion == "Consulta de riesgo"
    backend_action = {
        "Login": "AUTH_LOGIN",
        "Logout": "AUTH_LOGOUT",
        "Actualizacion de umbrales": "ADMIN_CONFIGURATION_CHANGED",
        "Cambio de parametros": "ADMIN_CONFIGURATION_CHANGED",
        "Revision manual": "CASE_DECISION_RECORDED",
    }.get(accion, "")
    backend_result = {"OK": "OK", "Observado": "OBSERVED", "Bloqueado": "BLOCKED", "Error": "ERROR"}.get(resultado, "")
    backend_role = {"Administrador": "Admin", "Supervisor": "Supervisor", "Evaluador de Riesgos": "Evaluador", "Sistema": ""}.get(rol, "")
    sort_map = {
        "fechaHora": "timestamp",
        "usuario": "actor_id",
        "rol": "actor_role",
        "accion": "action",
        "identificadorConsultado": "entity_id",
        "resultado": "result",
        "ip": "detail",
        "detalle": "detail",
    }
    query_page = 0 if export_format_filter or risk_action_filter else page
    query_page_size = 10000 if export_format_filter or risk_action_filter else pageSize
    rows, total = _repository.query(
        actor_id=usuario or None,
        actor_role=backend_role or None,
        entity_id=identificadorConsultado or None,
        action=backend_action or None,
        result=backend_result or None,
        date_from=fechaDesde or None,
        date_to=fechaHasta or None,
        page=query_page,
        page_size=query_page_size,
        sort_by=sort_map.get(sortBy, "timestamp"),
        sort_direction=sortDirection,
    )
    if export_format_filter:
        rows = [
            row for row in rows if row.action.value == "EXPORT_REQUESTED" and str(row.metadata.get("format", "")).lower() == export_format_filter
        ]
        total = len(rows)
    if risk_action_filter:
        rows = [
            row
            for row in rows
            if row.action.value
            in {"CASE_EVALUATED", "INTEGRATION_CONSUMED", "HARD_RULES_EXECUTED", "REASONING_EXECUTED", "SCORING_EXECUTED"}
            or row.action.value in {"CASE_CREATED", "CASE_VALIDATED", "FINAL_ASSESSMENT_GENERATED"}
        ]
        total = len(rows)
    if export_format_filter or risk_action_filter:
        start = page * pageSize
        rows = rows[start : start + pageSize]
    return AuditLogPageDto(
        rows=[
            AuditLogRowDto(
                id=row.audit_id,
                fechaHora=row.timestamp.isoformat(),
                usuario=row.actor_id or "Sistema",
                rol=_map_role(row.actor_role),
                accion=(
                    f"Exportacion {str(row.metadata.get('format', 'pdf')).upper()}"
                    if row.action.value == "EXPORT_REQUESTED"
                    else _map_action(row.action.value)
                ),
                identificadorConsultado=row.entity_id,
                resultado=_map_result(row.result.value),
                ip=str(row.metadata.get("clientIp", row.metadata.get("ip", "N/D"))),
                detalle=row.detail,
            )
            for row in rows
        ],
        total=total,
    )


@router.get("/cases/{case_id}/timeline", response_model=AuditCaseTimelineDto)
def get_case_audit_timeline(
    case_id: str,
    actor: dict[str, str | None] = Depends(require_actor),
) -> AuditCaseTimelineDto:
    require_roles(actor, {"Admin", "Supervisor"})
    rows, _total = _repository.query(
        entity_id=case_id,
        page=0,
        page_size=500,
        sort_by="timestamp",
        sort_direction="asc",
    )
    return AuditCaseTimelineDto(
        caseId=case_id,
        rows=[
            AuditCaseTimelineRowDto(
                id=row.audit_id,
                fechaHora=row.timestamp.isoformat(),
                stage=_map_stage(row.action.value),
                eventCode=row.action.value,
                resultado=_map_result(row.result.value),
                actor=row.actor_id or "Sistema",
                detalle=row.detail,
                metadata=row.metadata,
            )
            for row in rows
        ],
    )


@router.post("/logs/events", status_code=202)
def append_audit_event(
    payload: AuditEventRequestDto,
    actor: dict[str, str | None] = Depends(require_actor),
) -> None:
    require_roles(actor, {"Admin", "Supervisor"})
    _repository.append(
        AuditLog(
            audit_id=f"AUD-{uuid4().hex[:10].upper()}",
            action=AuditActionType.ADMIN_CONFIGURATION_CHANGED,
            result=AuditResultType(payload.result),
            entity_type=payload.entityType,
            entity_id=payload.entityId,
            actor_id=actor.get("id"),
            actor_role=actor.get("role"),
            correlation_id=None,
            detail=payload.detail,
            metadata=payload.metadata,
        )
    )
