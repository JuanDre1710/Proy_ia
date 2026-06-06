from __future__ import annotations

import unittest
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_case_repository import FileCaseRepository
from ers_core.adapters.repositories.file_export_repository import FileExportRepository
from ers_core.application.services.case_export_service import CaseExportService
from ers_core.domain.enums import CaseProcessingState, DocumentType, IdentityLifecycleStatus
from ers_core.domain.models import Case, IdentityStatus, Person


class CaseExportServiceTests(unittest.TestCase):
    def test_export_service_persists_pdf_and_csv(self) -> None:
        root = Path("data") / "test_runs" / f"export_unit_{uuid4().hex[:8]}"
        root.mkdir(parents=True, exist_ok=True)
        try:
            case_repository = FileCaseRepository(root / "cases.json")
            audit_repository = FileAuditLogRepository(root / "audit_logs.jsonl")
            export_repository = FileExportRepository(root / "exports.json", root / "files")
            service = CaseExportService(case_repository, export_repository, audit_repository)
            now = datetime.utcnow()
            case_repository.save(
                Case(
                    case_id="30111201",
                    created_at=now,
                    updated_at=now,
                    requested_by="usr-eval",
                    source_channel="test",
                    processing_state=CaseProcessingState.SCORED,
                    validation_results={},
                    subject=Person(
                        person_id="30111201",
                        full_name="Export Case",
                        document_type=DocumentType.DNI,
                        document_number="30111201",
                    ),
                    identity_status=IdentityStatus(
                        status=IdentityLifecycleStatus.VERIFIED,
                        verified=True,
                        deceased=False,
                        source_reference="RENAPER",
                    ),
                    metadata={},
                )
            )

            pdf = service.export_case(case_id="30111201", export_format="pdf", actor_id="usr-admin", actor_name="Admin", actor_role="Admin")
            csv = service.export_case(case_id="30111201", export_format="csv", actor_id="usr-admin", actor_name="Admin", actor_role="Admin")

            self.assertTrue(Path(pdf.file_path).exists())
            self.assertTrue(Path(csv.file_path).exists())
            self.assertGreater(pdf.size_bytes, 0)
            self.assertGreater(csv.size_bytes, 0)
        finally:
            import shutil

            shutil.rmtree(root, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
