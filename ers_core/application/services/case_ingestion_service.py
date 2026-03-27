from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from typing import Any

from ers_core.application.ports.case_repository import CaseRepository
from ers_core.application.ports.integration_repository import AuditLogRepository
from ers_core.domain.enums import (
    AuditActionType,
    AuditResultType,
    CaseProcessingState,
    DocumentType,
    IdentityLifecycleStatus,
    ProviderType,
)
from ers_core.domain.models import AuditLog, Case, IdentityStatus, Person

DAILY_LIMIT = 12


def detect_identifier_type(identifier: str) -> DocumentType | None:
    if not identifier.isdigit():
        return None
    if len(identifier) == 8:
        return DocumentType.DNI
    if len(identifier) == 11:
        if identifier.startswith(("20", "23", "24", "27")):
          return DocumentType.CUIL
        if identifier.startswith("30"):
          return DocumentType.CUIT
        return DocumentType.CUIL
    return None


class CaseIngestionService:
    def __init__(
        self,
        case_repository: CaseRepository,
        audit_repository: AuditLogRepository,
        integration_manager: Any,
    ) -> None:
        self._case_repository = case_repository
        self._audit_repository = audit_repository
        self._integration_manager = integration_manager

    def create_case_evaluation(
        self,
        *,
        identifier: str,
        requested_by: str,
        source_channel: str,
    ) -> Case:
        now = datetime.utcnow()
        validation_results: dict[str, str] = {}

        document_type = detect_identifier_type(identifier)
        if document_type is None:
            validation_results["identifier"] = "invalid"
            case = self._build_case(
                identifier=identifier,
                requested_by=requested_by,
                source_channel=source_channel,
                created_at=now,
                state=CaseProcessingState.INVALID_IDENTIFIER,
                validation_results=validation_results,
                document_type=DocumentType.UNKNOWN,
            )
            saved = self._case_repository.save(case)
            self._audit_created(saved)
            self._audit_validation(saved, "Identifier validation failed", AuditResultType.OBSERVED)
            return saved

        validation_results["identifier"] = "valid"

        if not requested_by.strip():
            validation_results["required_input"] = "missing_requested_by"
            case = self._build_case(
                identifier=identifier,
                requested_by=requested_by,
                source_channel=source_channel,
                created_at=now,
                state=CaseProcessingState.INSUFFICIENT_INPUT,
                validation_results=validation_results,
                document_type=document_type,
            )
            saved = self._case_repository.save(case)
            self._audit_created(saved)
            self._audit_validation(saved, "Required input validation failed", AuditResultType.OBSERVED)
            return saved

        validation_results["required_input"] = "valid"

        current_count = self._case_repository.count_by_user_and_day(requested_by, now.date().isoformat())
        if current_count >= DAILY_LIMIT:
            validation_results["daily_limit"] = "reached"
            case = self._build_case(
                identifier=identifier,
                requested_by=requested_by,
                source_channel=source_channel,
                created_at=now,
                state=CaseProcessingState.DAILY_LIMIT_REACHED,
                validation_results=validation_results,
                document_type=document_type,
            )
            saved = self._case_repository.save(case)
            self._audit_created(saved)
            self._audit_validation(saved, "Daily limit reached", AuditResultType.BLOCKED)
            return saved

        validation_results["daily_limit"] = "ok"

        active_provider_types = {
            item.provider_type for item in self._integration_manager.list_active_integrations()
        }
        missing_provider_types = [
            provider.value
            for provider in (ProviderType.IDENTITY, ProviderType.FINANCIAL)
            if provider not in active_provider_types
        ]
        if missing_provider_types:
            validation_results["required_integrations"] = f"missing:{','.join(missing_provider_types)}"
            state = CaseProcessingState.WAITING_FOR_ENRICHMENT
        else:
            validation_results["required_integrations"] = "ok"
            state = CaseProcessingState.ACCEPTED_FOR_PROCESSING

        case = self._build_case(
            identifier=identifier,
            requested_by=requested_by,
            source_channel=source_channel,
            created_at=now,
            state=state,
            validation_results=validation_results,
            document_type=document_type,
        )
        saved = self._case_repository.save(case)
        self._audit_created(saved)
        self._audit_validation(saved, "Case ingestion completed", AuditResultType.OK)
        return saved

    def get_case(self, case_id: str) -> Case | None:
        return self._case_repository.get_by_id(case_id)

    def _build_case(
        self,
        *,
        identifier: str,
        requested_by: str,
        source_channel: str,
        created_at: datetime,
        state: CaseProcessingState,
        validation_results: dict[str, str],
        document_type: DocumentType,
    ) -> Case:
        person = Person(
            person_id=identifier,
            full_name="Pendiente de enrichment",
            document_type=document_type,
            document_number=identifier,
            metadata={"ingestionOnly": True},
        )
        identity_status = IdentityStatus(
            status=IdentityLifecycleStatus.UNVERIFIED,
            verified=False,
            deceased=False,
            source_reference=None,
            source_timestamp=None,
            inconsistencies=[],
            quality_score=None,
        )

        return Case(
            case_id=identifier,
            created_at=created_at,
            updated_at=created_at,
            requested_by=requested_by,
            source_channel=source_channel,
            processing_state=state,
            validation_results=validation_results,
            subject=person,
            identity_status=identity_status,
            financial_info=None,
            labor_fiscal_info=None,
            evidences=[],
            alerts=[],
            reasoning_result=None,
            score_result=None,
            final_assessment=None,
            consolidated_evidence=None,
            hard_rule_evaluation=None,
            latest_decision=None,
            tags=["ingestion-only"],
            metadata={
                "pipelineStage": "ingestion_validation",
                "validatedAt": created_at.isoformat(),
            },
        )

    def _audit_created(self, case: Case) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-CASE-CREATED-{case.case_id}-{int(case.updated_at.timestamp())}",
                action=AuditActionType.CASE_CREATED,
                result=AuditResultType.OK,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=case.requested_by,
                actor_role=None,
                correlation_id=case.case_id,
                detail="Case created for evaluation request",
                metadata={
                    "processingState": case.processing_state.value,
                    "sourceChannel": case.source_channel,
                },
            )
        )

    def _audit_validation(self, case: Case, detail: str, result: AuditResultType) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-CASE-VALIDATED-{case.case_id}-{int(case.updated_at.timestamp())}",
                action=AuditActionType.CASE_VALIDATED,
                result=result,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=case.requested_by,
                actor_role=None,
                correlation_id=case.case_id,
                detail=detail,
                metadata={
                    "processingState": case.processing_state.value,
                    "validationResults": case.validation_results,
                },
            )
        )
