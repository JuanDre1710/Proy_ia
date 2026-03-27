from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_case_repository import FileCaseRepository
from ers_core.adapters.repositories.file_export_repository import FileExportRepository
from ers_core.config.app_settings import get_settings
from ers_core.application.services.case_export_service import CaseExportError, CaseExportService
from .export_schemas import CaseExportResponseDto
from .security import require_actor, require_roles

router = APIRouter(tags=["exports"])
settings = get_settings()

_case_repository = FileCaseRepository(settings.data_dir / "cases.json")
_audit_repository = FileAuditLogRepository(settings.data_dir / "audit_logs.jsonl")
_export_repository = FileExportRepository(settings.data_dir / "exports" / "exports.json", settings.export_dir)
_service = CaseExportService(_case_repository, _export_repository, _audit_repository)


@router.post("/cases/{case_id}/exports/pdf", response_model=CaseExportResponseDto)
def export_case_pdf(case_id: str, actor: dict[str, str | None] = Depends(require_actor)) -> CaseExportResponseDto:
    require_roles(actor, {"Admin", "Supervisor", "Evaluador"})
    try:
        export_record = _service.export_case(
            case_id=case_id,
            export_format="pdf",
            actor_id=actor.get("id"),
            actor_name=actor.get("name"),
            actor_role=actor.get("role"),
        )
    except CaseExportError as exc:
        raise HTTPException(status_code=400 if "format" in str(exc).lower() else 404, detail=str(exc)) from exc
    return CaseExportResponseDto(
        exportId=export_record.export_id,
        filename=export_record.filename,
        format=export_record.format,
        status=export_record.status,
        downloadUrl=f"/exports/{export_record.export_id}",
        createdAt=export_record.created_at.isoformat(),
    )


@router.post("/cases/{case_id}/exports/csv", response_model=CaseExportResponseDto)
def export_case_csv(case_id: str, actor: dict[str, str | None] = Depends(require_actor)) -> CaseExportResponseDto:
    require_roles(actor, {"Admin", "Supervisor", "Evaluador"})
    try:
        export_record = _service.export_case(
            case_id=case_id,
            export_format="csv",
            actor_id=actor.get("id"),
            actor_name=actor.get("name"),
            actor_role=actor.get("role"),
        )
    except CaseExportError as exc:
        raise HTTPException(status_code=400 if "format" in str(exc).lower() else 404, detail=str(exc)) from exc
    return CaseExportResponseDto(
        exportId=export_record.export_id,
        filename=export_record.filename,
        format=export_record.format,
        status=export_record.status,
        downloadUrl=f"/exports/{export_record.export_id}",
        createdAt=export_record.created_at.isoformat(),
    )


@router.get("/exports/{export_id}")
def get_export(export_id: str, actor: dict[str, str | None] = Depends(require_actor)) -> FileResponse:
    require_roles(actor, {"Admin", "Supervisor", "Evaluador"})
    export_record = _service.get_export(export_id)
    if export_record is None:
        raise HTTPException(status_code=404, detail="Export not found.")
    return FileResponse(
        path=export_record.file_path,
        media_type=export_record.content_type,
        filename=export_record.filename,
    )
