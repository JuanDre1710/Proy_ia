from __future__ import annotations

from datetime import datetime
from pathlib import Path
from uuid import uuid4

from ers_core.application.ports.case_repository import CaseRepository
from ers_core.application.ports.integration_repository import AuditLogRepository
from ers_core.domain.enums import AuditActionType, AuditResultType
from ers_core.domain.models import AuditLog, ExportRecord


class CaseExportError(Exception):
    pass


class CaseExportService:
    def __init__(self, case_repository: CaseRepository, export_repository: any, audit_repository: AuditLogRepository) -> None:
        self._case_repository = case_repository
        self._export_repository = export_repository
        self._audit_repository = audit_repository

    def export_case(
        self,
        *,
        case_id: str,
        export_format: str,
        actor_id: str | None,
        actor_name: str | None,
        actor_role: str | None,
    ) -> ExportRecord:
        case = self._case_repository.get_by_id(case_id)
        if case is None:
            raise CaseExportError("Case not found.")

        normalized_format = export_format.lower()
        if normalized_format not in {"pdf", "csv"}:
            raise CaseExportError("Unsupported export format.")

        filename = self._build_filename(case.case_id, normalized_format)
        target = self._export_repository.storage_path_for(filename)
        content = self._build_content(case, normalized_format)
        target.write_bytes(content)

        record = ExportRecord(
            export_id=f"EXP-{uuid4().hex[:10].upper()}",
            case_id=case.case_id,
            format=normalized_format,
            filename=filename,
            file_path=str(target),
            content_type="application/pdf" if normalized_format == "pdf" else "text/csv; charset=utf-8",
            size_bytes=target.stat().st_size,
            created_by_id=actor_id,
            created_by_name=actor_name,
            created_by_role=actor_role,
            metadata={
                "processingState": case.processing_state.value,
                "scoreCategory": case.score_result.risk_category.value if case.score_result else None,
            },
        )
        saved = self._export_repository.save(record)
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-EXPORT-{saved.export_id}",
                action=AuditActionType.EXPORT_REQUESTED,
                result=AuditResultType.OK,
                entity_type="CaseExport",
                entity_id=saved.export_id,
                actor_id=actor_id,
                actor_role=actor_role,
                correlation_id=case.case_id,
                detail=f"Case export generated in {normalized_format.upper()} format",
                metadata={
                    "caseId": case.case_id,
                    "filename": saved.filename,
                    "createdBy": actor_name,
                    "format": normalized_format,
                },
            )
        )
        return saved

    def get_export(self, export_id: str) -> ExportRecord | None:
        return self._export_repository.get_by_id(export_id)

    def _build_filename(self, case_id: str, export_format: str) -> str:
        return f"{datetime.utcnow().date().isoformat()}_{case_id}_ers_export.{export_format}"

    def _build_content(self, case: any, export_format: str) -> bytes:
        if export_format == "csv":
            rows = [
                ["field", "value"],
                ["caseId", case.case_id],
                ["document", case.subject.document_number],
                ["fullName", case.subject.full_name],
                ["processingState", case.processing_state.value],
                ["score", str(case.score_result.score_value if case.score_result else "")],
                ["riskCategory", case.score_result.risk_category.value if case.score_result else ""],
                ["finalStatus", case.final_assessment.final_status if case.final_assessment else ""],
                ["recommendedAction", case.final_assessment.recommended_action.value if case.final_assessment else ""],
                ["analystSummary", case.metadata.get("analystSummary", "")],
                ["alerts", str(len(case.alerts))],
            ]
            text = "\n".join(",".join(f"\"{str(value).replace('\"', '\"\"')}\"" for value in row) for row in rows)
            return text.encode("utf-8")

        lines = [
            "ERS - Informe de Caso",
            f"Caso: {case.case_id}",
            f"Documento: {case.subject.document_number}",
            f"Nombre: {case.subject.full_name}",
            f"Estado pipeline: {case.processing_state.value}",
            f"Score: {round(case.score_result.score_value, 2) if case.score_result else 'N/D'}",
            f"Categoria: {case.score_result.risk_category.value if case.score_result else 'N/D'}",
            f"Estado final: {case.final_assessment.final_status if case.final_assessment else 'N/D'}",
            f"Accion recomendada: {case.final_assessment.recommended_action.value if case.final_assessment else 'N/D'}",
            f"Prioridad final: {case.final_assessment.final_priority if case.final_assessment else 'N/D'}",
            f"Resumen analista: {case.metadata.get('analystSummary', '')}",
            f"Fecha exportacion: {datetime.utcnow().isoformat()}",
        ]
        return self._build_pdf(lines)

    def _build_pdf(self, lines: list[str]) -> bytes:
        escaped = [line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in lines]
        stream_lines = ["BT", "/F1 11 Tf", "50 760 Td"]
        for index, line in enumerate(escaped):
            if index == 0:
                stream_lines.append(f"({line}) Tj")
            else:
                stream_lines.append(f"0 -16 Td ({line}) Tj")
        stream_lines.append("ET")
        stream = "\n".join(stream_lines).encode("latin-1", errors="replace")

        objects = [
            b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
            b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
            b"4 0 obj << /Length " + str(len(stream)).encode("ascii") + b" >> stream\n" + stream + b"\nendstream endobj",
            b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        ]
        content = bytearray(b"%PDF-1.4\n")
        offsets = [0]
        for obj in objects:
            offsets.append(len(content))
            content.extend(obj)
            content.extend(b"\n")
        xref_offset = len(content)
        content.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
        content.extend(b"0000000000 65535 f \n")
        for offset in offsets[1:]:
            content.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
        content.extend(
            (
                f"trailer << /Size {len(offsets)} /Root 1 0 R >>\n"
                f"startxref\n{xref_offset}\n%%EOF"
            ).encode("ascii")
        )
        return bytes(content)
