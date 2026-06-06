from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from ers_core.application.ports.identity_claim_provider import (
    ICaseDataProvider,
    IClaimQueryProvider,
    IPersonSearchProvider,
)
from ers_core.application.ports.integration_repository import AuditLogRepository
from ers_core.application.services.internal_case_analysis_service import InternalCaseAnalysisService
from ers_core.domain.enums import AuditActionType, AuditResultType
from ers_core.domain.identity_search_models import ClaimRecord, IdentitySearchQuery, IdentitySearchResult
from ers_core.domain.models import AuditLog, Case


class IdentitySearchService:
    def __init__(
        self,
        *,
        person_provider: IPersonSearchProvider,
        claim_provider: IClaimQueryProvider,
        audit_repository: AuditLogRepository,
        active_claim_status_codes: tuple[str, ...],
    ) -> None:
        self._person_provider = person_provider
        self._claim_provider = claim_provider
        self._audit_repository = audit_repository
        self._active_claim_status_codes = {item.upper() for item in active_claim_status_codes}

    def search(
        self,
        *,
        query: IdentitySearchQuery,
        requested_by: str | None,
        source_channel: str,
    ) -> IdentitySearchResult:
        person = self._person_provider.search_person(query)
        if person is None:
            result = IdentitySearchResult(
                search_status="not_found",
                person=None,
                active_claims=[],
                total_claims=0,
                can_auto_analyze=False,
                requires_claim_selection=False,
            )
            self._audit_search(query=query, requested_by=requested_by, source_channel=source_channel, result=result)
            return result

        claims = self._claim_provider.list_claims_by_person(person.person_id)
        active_claims = [claim for claim in claims if self._is_active(claim)]

        if not active_claims:
            search_status = "person_without_active_claims"
        elif len(active_claims) == 1:
            search_status = "single_active_claim"
        else:
            search_status = "multiple_active_claims"

        result = IdentitySearchResult(
            search_status=search_status,
            person=person,
            active_claims=active_claims,
            total_claims=len(claims),
            can_auto_analyze=len(active_claims) == 1,
            requires_claim_selection=len(active_claims) > 1,
        )
        self._audit_search(query=query, requested_by=requested_by, source_channel=source_channel, result=result)
        return result

    def _is_active(self, claim: ClaimRecord) -> bool:
        if claim.is_active_hint is not None:
            return claim.is_active_hint
        return claim.status_code.upper() in self._active_claim_status_codes

    def _audit_search(
        self,
        *,
        query: IdentitySearchQuery,
        requested_by: str | None,
        source_channel: str,
        result: IdentitySearchResult,
    ) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-{uuid4().hex[:10].upper()}",
                action=AuditActionType.IDENTITY_SEARCHED,
                result=AuditResultType.OK if result.search_status != "not_found" else AuditResultType.OBSERVED,
                entity_type="IdentitySearch",
                entity_id=query.normalized_identifier,
                actor_id=requested_by,
                actor_role=None,
                correlation_id=query.normalized_identifier,
                detail=f"Identity search resolved with status {result.search_status}.",
                metadata={
                    "sourceChannel": source_channel,
                    "identifierType": query.identifier_type,
                    "documentTypeHint": query.document_type_hint,
                    "totalClaims": result.total_claims,
                    "activeClaims": len(result.active_claims),
                    "personId": result.person.person_id if result.person else None,
                },
            )
        )


class CaseAssemblyService:
    def __init__(
        self,
        *,
        case_data_provider: ICaseDataProvider,
        internal_case_analysis_service: InternalCaseAnalysisService,
        audit_repository: AuditLogRepository,
    ) -> None:
        self._case_data_provider = case_data_provider
        self._internal_case_analysis_service = internal_case_analysis_service
        self._audit_repository = audit_repository

    def create_case_from_claim(
        self,
        *,
        claim_id: str,
        requested_by: str,
        source_channel: str,
    ) -> Case:
        assembly_payload = self._case_data_provider.build_case_payload(claim_id)
        if assembly_payload is None:
            raise KeyError("Claim not found for case assembly.")

        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-{uuid4().hex[:10].upper()}",
                action=AuditActionType.CLAIM_SELECTED,
                result=AuditResultType.OK,
                entity_type="Claim",
                entity_id=claim_id,
                actor_id=requested_by,
                actor_role=None,
                correlation_id=claim_id,
                detail="Claim selected for case assembly.",
                metadata={
                    "personId": assembly_payload.person_id,
                    "sourceChannel": source_channel,
                    "selectedAt": datetime.utcnow().isoformat(),
                },
            )
        )

        case = self._internal_case_analysis_service.analyze_internal_case(
            payload=assembly_payload.payload,
            requested_by=requested_by,
            source_channel=source_channel,
        )

        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-{uuid4().hex[:10].upper()}",
                action=AuditActionType.CASE_ASSEMBLED_FROM_CLAIM,
                result=AuditResultType.OK,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=requested_by,
                actor_role=None,
                correlation_id=case.case_id,
                detail="Case assembled from selected claim.",
                metadata={
                    "claimId": claim_id,
                    "personId": assembly_payload.person_id,
                    "sourceChannel": source_channel,
                },
            )
        )
        return case

