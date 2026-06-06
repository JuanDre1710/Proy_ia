from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from ers_core.application.ports.case_repository import CaseRepository
from ers_core.application.ports.integration_repository import AuditLogRepository
from ers_core.application.services.case_ingestion_service import detect_identifier_type
from ers_core.application.services.case_pipeline_service import CasePipelineService
from ers_core.domain.enums import (
    AlertSeverity,
    AuditActionType,
    AuditResultType,
    CaseProcessingState,
    EvidenceQuality,
    EvidenceSourceType,
    IdentityLifecycleStatus,
)
from ers_core.domain.models import (
    Alert,
    AuditLog,
    Case,
    ConsolidatedEvidence,
    Evidence,
    FinancialInfo,
    IdentityStatus,
    LaborFiscalInfo,
    Person,
)


class InternalCaseAnalysisError(ValueError):
    pass


class InternalCaseAnalysisService:
    def __init__(
        self,
        case_repository: CaseRepository,
        audit_repository: AuditLogRepository,
        pipeline_service: CasePipelineService,
    ) -> None:
        self._case_repository = case_repository
        self._audit_repository = audit_repository
        self._pipeline_service = pipeline_service

    def analyze_internal_case(
        self,
        *,
        payload: dict[str, Any],
        requested_by: str,
        source_channel: str,
    ) -> Case:
        identifier = str(payload.get("identifier", "")).strip()
        document_type = detect_identifier_type(identifier)
        if document_type is None:
            raise InternalCaseAnalysisError("Identifier is invalid for internal case analysis.")
        if not requested_by.strip():
            raise InternalCaseAnalysisError("requestedBy is required for internal case analysis.")

        now = datetime.utcnow()
        case = self._build_case(
            identifier=identifier,
            document_type=document_type,
            requested_by=requested_by.strip(),
            source_channel=source_channel,
            payload=payload,
            created_at=now,
        )
        saved = self._case_repository.save(case)
        self._audit_created(saved)
        self._audit_validated(saved)

        ruled_case = self._pipeline_service.apply_hard_rules(saved)
        reasoned_case = self._pipeline_service.apply_reasoning(ruled_case)
        scored_case = self._pipeline_service.apply_scoring(reasoned_case)
        related_case = self._pipeline_service.apply_relationships(scored_case)
        assessed_case = self._pipeline_service.apply_final_assessment(related_case)
        final_case = self._case_repository.save(assessed_case)
        self._audit_evaluated(final_case)
        return final_case

    def _build_case(
        self,
        *,
        identifier: str,
        document_type: Any,
        requested_by: str,
        source_channel: str,
        payload: dict[str, Any],
        created_at: datetime,
    ) -> Case:
        subject_payload = payload.get("subject") or {}
        financial_payload = payload.get("financialInfo") or {}
        labor_payload = payload.get("laborFiscalInfo") or {}
        claim_payload = payload.get("claim") or {}
        inconsistencies = [str(item) for item in payload.get("inconsistencies", []) if str(item).strip()]
        missing_evidence = [str(item) for item in payload.get("missingEvidence", []) if str(item).strip()]
        evidence_for_review = [str(item) for item in payload.get("evidenceForReview", []) if str(item).strip()]
        evidence_against_fraud = [str(item) for item in payload.get("evidenceAgainstFraud", []) if str(item).strip()]
        claims_history = payload.get("claimsHistory") if isinstance(payload.get("claimsHistory"), list) else []
        case_context = payload.get("caseContext") if isinstance(payload.get("caseContext"), dict) else {}

        case_id = f"INT-{identifier}-{uuid4().hex[:6].upper()}"
        subject = Person(
            person_id=identifier,
            full_name=str(subject_payload.get("fullName") or "Caso interno demo"),
            document_type=document_type,
            document_number=identifier,
            birth_date=subject_payload.get("birthDate"),
            age=subject_payload.get("age"),
            email=subject_payload.get("email"),
            phone=subject_payload.get("phone"),
            address=subject_payload.get("address"),
            locality=subject_payload.get("locality"),
            province=subject_payload.get("province"),
            metadata={"source": "internal_claim_json", "stage": "instance_1_internal"},
        )
        identity_status = IdentityStatus(
            status=IdentityLifecycleStatus.VERIFIED if bool(subject_payload.get("verified", True)) else IdentityLifecycleStatus.UNVERIFIED,
            verified=bool(subject_payload.get("verified", True)),
            deceased=bool(subject_payload.get("deceased", False)),
            source_reference="internal-claim-db-demo",
            source_timestamp=created_at,
            inconsistencies=inconsistencies,
            quality_score=0.85 if not missing_evidence else 0.65,
        )
        financial_info = FinancialInfo(
            credit_score=int(financial_payload.get("creditScore") or 0),
            debt_ratio=float(financial_payload.get("debtRatio") or 0.0),
            bancarization_level=financial_payload.get("bancarizationLevel"),
            active_loans=int(financial_payload.get("activeLoans") or 0),
            bounced_checks=int(financial_payload.get("bouncedChecks") or 0),
            monthly_income_estimate=financial_payload.get("monthlyIncomeEstimate"),
            observation=financial_payload.get("observation"),
            source_reference="internal-claim-db-demo",
            quality_score=0.8 if not missing_evidence else 0.6,
            attributes={"previousClaims": int(claim_payload.get("previousClaimsCount") or 0)},
        )
        labor_fiscal_info = LaborFiscalInfo(
            tax_status=labor_payload.get("taxStatus"),
            main_activity=labor_payload.get("mainActivity"),
            employer_or_company=labor_payload.get("employerOrCompany"),
            income_bracket=labor_payload.get("incomeBracket"),
            registered_employees=labor_payload.get("registeredEmployees"),
            fiscal_observation=labor_payload.get("fiscalObservation"),
            source_reference="internal-claim-db-demo",
            quality_score=0.8 if not missing_evidence else 0.6,
            attributes={
                "declaredProvince": labor_payload.get("declaredProvince") or subject.province or "",
            },
        )

        evidences = [
            Evidence(
                evidence_id=f"EVI-SUBJECT-{case_id}",
                source_type=EvidenceSourceType.SYSTEM,
                provider_code="INTERNAL_CLAIM_DB",
                title="Ficha interna del asegurado",
                summary="Datos del titular y del expediente obtenidos del sistema core.",
                details=f"Titular {subject.full_name}. Identificador {identifier}.",
                collected_at=created_at,
                quality=EvidenceQuality.HIGH if not missing_evidence else EvidenceQuality.MEDIUM,
                quality_score=0.9 if not missing_evidence else 0.7,
                related_keys=["subject", "claim"],
                attributes={"stage": "instance_1_internal"},
            ),
            Evidence(
                evidence_id=f"EVI-FIN-{case_id}",
                source_type=EvidenceSourceType.FINANCIAL,
                provider_code="INTERNAL_CLAIM_DB",
                title="Variables financieras internas",
                summary="Variables financieras disponibles dentro del sistema demo.",
                details=f"Credit score {financial_info.credit_score}, debt ratio {financial_info.debt_ratio}.",
                collected_at=created_at,
                quality=EvidenceQuality.MEDIUM,
                quality_score=financial_info.quality_score,
                related_keys=["financialInfo"],
                attributes={"stage": "instance_1_internal"},
            ),
            Evidence(
                evidence_id=f"EVI-LAB-{case_id}",
                source_type=EvidenceSourceType.LABOR_FISCAL,
                provider_code="INTERNAL_CLAIM_DB",
                title="Variables laborales y fiscales internas",
                summary="Datos laborales/fiscales disponibles en la instancia interna demo.",
                details=f"Actividad principal: {labor_fiscal_info.main_activity or 'sin dato'}.",
                collected_at=created_at,
                quality=EvidenceQuality.MEDIUM,
                quality_score=labor_fiscal_info.quality_score,
                related_keys=["laborFiscalInfo"],
                attributes={"stage": "instance_1_internal"},
            ),
        ]

        alerts: list[Alert] = []
        for index, item in enumerate(inconsistencies, start=1):
            alerts.append(
                Alert(
                    alert_id=f"ALT-INC-{case_id}-{index}",
                    severity=AlertSeverity.WARNING,
                    title="Inconsistencia interna detectada",
                    short_description=item,
                    detail=item,
                    source_type=EvidenceSourceType.SYSTEM,
                    source_reference="internal_case_upload",
                    related_variable="inconsistency",
                    recommendation_hint="Validar el expediente antes de enriquecer con fuentes externas.",
                    evidence_ids=[evidences[0].evidence_id],
                )
            )
        for index, item in enumerate(missing_evidence, start=1):
            alerts.append(
                Alert(
                    alert_id=f"ALT-MISSING-{case_id}-{index}",
                    severity=AlertSeverity.INFO,
                    title="Evidencia pendiente",
                    short_description=item,
                    detail=item,
                    source_type=EvidenceSourceType.SYSTEM,
                    source_reference="internal_case_upload",
                    related_variable="missing_evidence",
                    recommendation_hint="Resolver el faltante si la instancia 1 no alcanza para decidir.",
                    evidence_ids=[],
                )
            )

        consolidated_evidence = ConsolidatedEvidence(
            bundle_id=f"EVB-{case_id}",
            collected_at=created_at,
            ready_for_rules=True,
            provider_statuses={
                "IDENTITY": "ok",
                "FINANCIAL": "ok",
                "LABOR_FISCAL": "ok",
            },
            warnings=missing_evidence,
            evidence_ids=[item.evidence_id for item in evidences],
            metadata={
                "mode": "internal_claim_analysis",
                "stage": "instance_1_internal",
                "futureEnrichmentMode": "conditional_instance_2",
            },
        )

        claim_amount = float(claim_payload.get("claimedAmount") or 0.0)
        previous_claims = int(claim_payload.get("previousClaimsCount") or 0)
        customer_antiquity_months = int(claim_payload.get("customerAntiquityMonths") or 0)

        return Case(
            case_id=case_id,
            created_at=created_at,
            updated_at=created_at,
            requested_by=requested_by,
            source_channel=source_channel,
            processing_state=CaseProcessingState.READY_FOR_RULES,
            subject=subject,
            identity_status=identity_status,
            validation_results={
                "identifier": "valid",
                "required_input": "valid",
                "analysisStage": "internal_claim_only",
                "externalEnrichment": "not_requested",
            },
            financial_info=financial_info,
            labor_fiscal_info=labor_fiscal_info,
            evidences=evidences,
            alerts=alerts,
            reasoning_result=None,
            score_result=None,
            final_assessment=None,
            consolidated_evidence=consolidated_evidence,
            hard_rule_evaluation=None,
            latest_decision=None,
            tags=["internal-claim-analysis", "instance-1-ready"],
            metadata={
                "pipelineStage": "internal_claim_intake",
                "validatedAt": created_at.isoformat(),
                "analysisMode": "two_stage_demo",
                "currentInstance": "instance_1_internal",
                "nextInstance": "instance_2_conditional_enrichment",
                "claimAmount": claim_amount,
                "previousClaimsCount": previous_claims,
                "customerAntiquityMonths": customer_antiquity_months,
                "highRiskZone": bool(claim_payload.get("highRiskZone", False)),
                "suspiciousImages": bool(claim_payload.get("suspiciousImages", False)),
                "sharedPhoneFlag": bool(claim_payload.get("sharedPhoneWithOtherCustomer", False)),
                "repeatedProviderFlag": bool(claim_payload.get("repeatedProvider", False)),
                "confirmedFraudHistory": bool(claim_payload.get("confirmedFraudHistory", False)),
                "claimReference": claim_payload.get("claimReference"),
                "claimDate": claim_payload.get("claimDate"),
                "claimType": claim_payload.get("claimType"),
                "claimNotes": claim_payload.get("notes"),
                "evidenceForReview": evidence_for_review,
                "evidenceAgainstFraud": evidence_against_fraud,
                "claimsHistory": claims_history,
                "selectedClaimId": case_context.get("selectedClaimId"),
                "sourcePersonId": case_context.get("personId"),
                "sourceTotalClaims": case_context.get("totalClaims"),
            },
        )

    def _audit_created(self, case: Case) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-INT-CREATED-{case.case_id}",
                action=AuditActionType.CASE_CREATED,
                result=AuditResultType.OK,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=case.requested_by,
                actor_role=None,
                correlation_id=case.case_id,
                detail="Internal claim case created from uploaded JSON.",
                metadata={"analysisStage": "instance_1_internal", "sourceChannel": case.source_channel},
            )
        )

    def _audit_validated(self, case: Case) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-INT-VALIDATED-{case.case_id}",
                action=AuditActionType.CASE_VALIDATED,
                result=AuditResultType.OK,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=case.requested_by,
                actor_role=None,
                correlation_id=case.case_id,
                detail="Internal claim JSON validated and mapped to canonical case model.",
                metadata={
                    "analysisStage": "instance_1_internal",
                    "validationResults": case.validation_results,
                },
            )
        )

    def _audit_evaluated(self, case: Case) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-INT-EVALUATED-{case.case_id}",
                action=AuditActionType.CASE_EVALUATED,
                result=AuditResultType.OK if case.final_assessment is not None else AuditResultType.OBSERVED,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=case.requested_by,
                actor_role=None,
                correlation_id=case.case_id,
                detail="Internal claim analysis completed for instance 1.",
                metadata={
                    "analysisStage": "instance_1_internal",
                    "processingState": case.processing_state.value,
                    "finalStatus": case.final_assessment.final_status if case.final_assessment else None,
                },
            )
        )
