from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AuditLogRowDto(BaseModel):
    id: str
    fechaHora: str
    usuario: str
    rol: Literal["Administrador", "Supervisor", "Evaluador de Riesgos", "Sistema"]
    accion: str
    identificadorConsultado: str
    resultado: Literal["OK", "Observado", "Bloqueado", "Error"]
    ip: str
    detalle: str


class AuditLogPageDto(BaseModel):
    rows: list[AuditLogRowDto] = Field(default_factory=list)
    total: int


class AuditCaseTimelineRowDto(BaseModel):
    id: str
    fechaHora: str
    stage: str
    eventCode: str
    resultado: Literal["OK", "Observado", "Bloqueado", "Error"]
    actor: str
    detalle: str
    metadata: dict = Field(default_factory=dict)


class AuditCaseTimelineDto(BaseModel):
    caseId: str
    rows: list[AuditCaseTimelineRowDto] = Field(default_factory=list)


class AuditEventRequestDto(BaseModel):
    action: str = Field(min_length=1, max_length=120)
    result: Literal["OK", "OBSERVED", "BLOCKED", "ERROR"] = "OK"
    entityType: str = Field(min_length=1, max_length=120)
    entityId: str = Field(min_length=1, max_length=160)
    detail: str = Field(min_length=1, max_length=500)
    metadata: dict = Field(default_factory=dict)
