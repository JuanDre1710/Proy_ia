from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ers_core.adapters.factories.identity_claim_provider_factory import IdentityClaimProviderFactory
from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_case_repository import FileCaseRepository
from ers_core.config.app_settings import get_settings
from ers_core.application.services.case_pipeline_service import CasePipelineService
from ers_core.application.services.case_ingestion_service import detect_identifier_type
from ers_core.application.services.identity_search_service import CaseAssemblyService, IdentitySearchService
from ers_core.application.services.internal_case_analysis_service import InternalCaseAnalysisService
from ers_core.domain.identity_search_models import IdentitySearchQuery
from .identity_schemas import (
    CaseFromClaimRequestDto,
    CaseFromClaimResponseDto,
    IdentityClaimSummaryDto,
    IdentityPersonDto,
    IdentitySearchRequestDto,
    IdentitySearchResponseDto,
)

router = APIRouter(prefix="/identity", tags=["identity-search"])
settings = get_settings()

_case_repository = FileCaseRepository(settings.data_dir / "cases.json")
_audit_repository = FileAuditLogRepository(settings.data_dir / "audit_logs.jsonl")
_provider = IdentityClaimProviderFactory.create(settings)
_pipeline_service = CasePipelineService(_case_repository, _audit_repository, integration_manager=None)
_internal_case_analysis_service = InternalCaseAnalysisService(
    _case_repository,
    _audit_repository,
    _pipeline_service,
)
_identity_search_service = IdentitySearchService(
    person_provider=_provider,
    claim_provider=_provider,
    audit_repository=_audit_repository,
    active_claim_status_codes=settings.active_claim_status_codes,
)
_case_assembly_service = CaseAssemblyService(
    case_data_provider=_provider,
    internal_case_analysis_service=_internal_case_analysis_service,
    audit_repository=_audit_repository,
)


def _message_for_status(status: str) -> str:
    if status == "single_active_claim":
        return "Se encontro un unico siniestro activo y puede continuarse el analisis."
    if status == "multiple_active_claims":
        return "La persona tiene multiples siniestros activos. El frontend debe solicitar seleccion."
    if status == "person_without_active_claims":
        return "La persona fue encontrada, pero no tiene siniestros activos disponibles para analisis."
    return "No se encontro una persona asociada a la identidad consultada."


@router.post("/search", response_model=IdentitySearchResponseDto)
def search_identity(payload: IdentitySearchRequestDto) -> IdentitySearchResponseDto:
    document_type = detect_identifier_type(payload.identifier.strip())
    if document_type is None:
        raise HTTPException(status_code=400, detail="Identifier is invalid.")

    try:
        result = _identity_search_service.search(
            query=IdentitySearchQuery(
                normalized_identifier=payload.identifier.strip(),
                identifier_type=document_type.value,
                document_type_hint=payload.documentType,
            ),
            requested_by=payload.requestedBy.strip(),
            source_channel=payload.sourceChannel,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return IdentitySearchResponseDto(
        searchStatus=result.search_status,  # type: ignore[arg-type]
        person=(
            IdentityPersonDto(
                personId=result.person.person_id,
                identifierValue=result.person.identifier_value,
                identifierType=result.person.identifier_type,
                documentType=result.person.document_type,
                documentNumber=result.person.document_number,
                taxId=result.person.tax_id,
                displayName=result.person.display_name,
                email=result.person.email,
            )
            if result.person
            else None
        ),
        activeClaims=[
            IdentityClaimSummaryDto(
                claimId=item.claim_id,
                claimNumber=item.claim_number,
                occurredAt=item.occurred_at,
                statusCode=item.status_code,
                statusLabel=item.status_label,
                claimedAmount=item.claimed_amount,
                estimatedAmount=item.estimated_amount,
                claimTypeId=item.claim_type_id,
                policyNumber=item.policy_number,
                certificateNumber=item.certificate_number,
            )
            for item in result.active_claims
        ],
        totalClaims=result.total_claims,
        canAutoAnalyze=result.can_auto_analyze,
        requiresClaimSelection=result.requires_claim_selection,
        activeClaimStatusCodes=list(settings.active_claim_status_codes),
        message=_message_for_status(result.search_status),
    )


@router.post("/cases/from-claim", response_model=CaseFromClaimResponseDto)
def create_case_from_claim(payload: CaseFromClaimRequestDto) -> CaseFromClaimResponseDto:
    try:
        case = _case_assembly_service.create_case_from_claim(
            claim_id=payload.claimId.strip(),
            requested_by=payload.requestedBy.strip(),
            source_channel=payload.sourceChannel,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return CaseFromClaimResponseDto(
        caseId=case.case_id,
        claimId=payload.claimId.strip(),
        status=case.processing_state.value,
        message="Caso armado desde siniestro y listo para abrir el dashboard.",
        canOpenDashboard=True,
        requestedAt=case.created_at.isoformat(),
    )

