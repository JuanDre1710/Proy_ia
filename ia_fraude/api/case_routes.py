from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException

from ers_core.adapters.factories.integration_adapter_factory import IntegrationAdapterFactory
from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_case_repository import FileCaseRepository
from ers_core.adapters.repositories.file_integration_repository import FileIntegrationConfigRepository
from ers_core.adapters.repositories.file_rule_repository import FileRuleConfigRepository
from ers_core.config.app_settings import get_settings
from ers_core.application.services.case_decision_service import CaseDecisionError, CaseDecisionService
from ers_core.application.services.case_ingestion_service import CaseIngestionService
from ers_core.application.services.internal_case_analysis_service import (
    InternalCaseAnalysisError,
    InternalCaseAnalysisService,
)
from ers_core.application.services.case_pipeline_service import CasePipelineService
from ers_core.application.services.integration_manager import IntegrationManager
from ers_core.domain.enums import DocumentType
from .case_schemas import (
    CaseAlertDto,
    CaseClaimHistoryDto,
    CaseDecisionDto,
    CaseDecisionHistoryItemDto,
    CaseDecisionRequestDto,
    CaseEvidenceSummaryDto,
    CaseEvaluateRequestDto,
    CaseEvaluateResponseDto,
    CaseFinalAssessmentDto,
    CaseGraphEdgeDto,
    CaseGraphNodeDto,
    CaseGraphResponseDto,
    CaseGraphSignalDto,
    CaseFinancialInfoDto,
    CaseLaborFiscalInfoDto,
    CaseReadResponseDto,
    CaseReasoningDto,
    CaseScoreDto,
    CaseSubjectDto,
    InternalCaseUploadRequestDto,
)

router = APIRouter(prefix="/cases", tags=["cases"])
settings = get_settings()

_case_repository = FileCaseRepository(settings.data_dir / "cases.json")
_audit_repository = FileAuditLogRepository(settings.data_dir / "audit_logs.jsonl")
_integration_repository = FileIntegrationConfigRepository(settings.data_dir / "integration_configs.json")
_rule_repository = FileRuleConfigRepository(settings.data_dir / "configured_rules.json")
_integration_manager = IntegrationManager(_integration_repository, _audit_repository, IntegrationAdapterFactory())
_case_service = CaseIngestionService(_case_repository, _audit_repository, _integration_manager)
_case_pipeline_service = CasePipelineService(_case_repository, _audit_repository, _integration_manager, _rule_repository)
_internal_case_analysis_service = InternalCaseAnalysisService(_case_repository, _audit_repository, _case_pipeline_service)
_case_decision_service = CaseDecisionService(_case_repository, _audit_repository)


def _map_decision_history(case) -> list[CaseDecisionHistoryItemDto]:
    return [
        CaseDecisionHistoryItemDto(
            decisionId=decision.decision_id,
            caseId=decision.case_id,
            status=decision.status.value,
            decidedAt=decision.created_at.isoformat(),
            decidedById=decision.actor_id,
            decidedBy=decision.actor_name,
            decidedByRole=decision.actor_role,
            comment=decision.comment,
            rationale=decision.rationale,
            supersedesDecisionId=decision.supersedes_decision_id,
        )
        for decision in case.decision_history
    ]


def _message_for_status(status: str, identifier_type: str | None) -> str:
    if status == "accepted_for_processing":
        return f"{identifier_type or 'Identificador'} validado. El caso fue aceptado para procesamiento."
    if status == "ready_for_rules":
        return f"{identifier_type or 'Identificador'} validado. La evidencia del caso fue consolidada y quedo lista para reglas."
    if status == "ready_for_reasoning":
        return f"{identifier_type or 'Identificador'} validado. Las reglas duras no bloquearon el caso y puede continuar a reasoning."
    if status == "not_evaluable":
        return "Las reglas duras marcaron el caso como no evaluable."
    if status == "excluded":
        return "Las reglas duras excluyeron el caso antes de reasoning y scoring."
    if status == "scored":
        return f"{identifier_type or 'Identificador'} validado. El caso fue enriquecido y scoreado."
    if status == "waiting_for_enrichment":
        return "El caso fue creado y quedo esperando enriquecimiento por disponibilidad de integraciones."
    if status == "daily_limit_reached":
        return "Se alcanzo el limite diario de evaluaciones para el usuario."
    if status == "insufficient_input":
        return "Faltan datos minimos obligatorios para iniciar la evaluacion."
    return "El identificador no es valido."


def _map_evaluate_response(case) -> CaseEvaluateResponseDto:
    identifier_type = None if case.subject.document_type == DocumentType.UNKNOWN else case.subject.document_type.value
    return CaseEvaluateResponseDto(
        caseId=case.case_id,
        identifier=case.subject.document_number,
        identifierType=identifier_type,
        status=case.processing_state.value,  # type: ignore[arg-type]
        message=_message_for_status(case.processing_state.value, identifier_type),
        canOpenDashboard=case.processing_state.value in {
            "accepted_for_processing",
            "waiting_for_enrichment",
            "ready_for_rules",
            "ready_for_reasoning",
            "not_evaluable",
            "excluded",
            "scored",
        },
        validationResults=case.validation_results,
        requestedAt=case.created_at.isoformat(),
    )


@router.post("/evaluate", response_model=CaseEvaluateResponseDto)
def evaluate_case(payload: CaseEvaluateRequestDto) -> CaseEvaluateResponseDto:
    case = _case_service.create_case_evaluation(
        identifier=payload.identifier.strip(),
        requested_by=payload.requestedBy.strip(),
        source_channel=payload.sourceChannel,
    )
    case = _case_pipeline_service.consolidate_case_evidence(case)
    return _map_evaluate_response(case)


@router.post("/evaluate/internal-json", response_model=CaseEvaluateResponseDto)
def evaluate_internal_json_case(payload: InternalCaseUploadRequestDto) -> CaseEvaluateResponseDto:
    try:
        case = _internal_case_analysis_service.analyze_internal_case(
            payload=payload.caseData.model_dump(),
            requested_by=payload.requestedBy.strip(),
            source_channel=payload.sourceChannel,
        )
    except InternalCaseAnalysisError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _map_evaluate_response(case)


@router.get("/{case_id}", response_model=CaseReadResponseDto)
def get_case(case_id: str) -> CaseReadResponseDto:
    case = _case_service.get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    identifier_type = None if case.subject.document_type == DocumentType.UNKNOWN else case.subject.document_type.value
    return CaseReadResponseDto(
        caseId=case.case_id,
        identifier=case.subject.document_number,
        identifierType=identifier_type,
        requestedBy=case.requested_by,
        requestedAt=case.created_at.isoformat(),
        status=case.processing_state.value,  # type: ignore[arg-type]
        sourceChannel=case.source_channel,
        validationResults=case.validation_results,
        metadata=case.metadata,
        subject=CaseSubjectDto(
            fullName=case.subject.full_name,
            birthDate=case.subject.birth_date,
            age=case.subject.age,
            email=case.subject.email,
            phone=case.subject.phone,
            address=case.subject.address,
            locality=case.subject.locality,
            province=case.subject.province,
            verified=case.identity_status.verified,
            deceased=case.identity_status.deceased,
        ),
        financialInfo=(
            CaseFinancialInfoDto(
                creditScore=case.financial_info.credit_score,
                debtRatio=case.financial_info.debt_ratio,
                bancarizationLevel=case.financial_info.bancarization_level,
                activeLoans=case.financial_info.active_loans,
                bouncedChecks=case.financial_info.bounced_checks,
                monthlyIncomeEstimate=case.financial_info.monthly_income_estimate,
                observation=case.financial_info.observation,
            )
            if case.financial_info
            else None
        ),
        laborFiscalInfo=(
            CaseLaborFiscalInfoDto(
                taxStatus=case.labor_fiscal_info.tax_status,
                mainActivity=case.labor_fiscal_info.main_activity,
                employerOrCompany=case.labor_fiscal_info.employer_or_company,
                incomeBracket=case.labor_fiscal_info.income_bracket,
                registeredEmployees=case.labor_fiscal_info.registered_employees,
                fiscalObservation=case.labor_fiscal_info.fiscal_observation,
            )
            if case.labor_fiscal_info
            else None
        ),
        claimsHistory=[
            CaseClaimHistoryDto(
                id=str(item.get("id", "")),
                date=str(item.get("date", "N/D")),
                type=str(item.get("type", "Sin tipo")),
                amount=float(item.get("amount", 0.0) or 0.0),
                status=str(item.get("status", "Observado")),
                counterpart=str(item.get("counterpart", "N/D")),
                notes=str(item.get("notes", "")),
            )
            for item in case.metadata.get("claimsHistory", [])
            if isinstance(item, dict)
        ],
        evidenceSummary=(
            CaseEvidenceSummaryDto(
                readyForRules=case.consolidated_evidence.ready_for_rules,
                providerStatuses=case.consolidated_evidence.provider_statuses,
                warnings=case.consolidated_evidence.warnings,
                evidenceCount=len(case.consolidated_evidence.evidence_ids),
            )
            if case.consolidated_evidence
            else None
        ),
        alerts=[
            CaseAlertDto(
                id=alert.alert_id,
                severity=alert.severity.value,
                title=alert.title,
                shortDescription=alert.short_description,
                detail=alert.detail,
                source=alert.source_type.value,
                relatedVariable=alert.related_variable,
                recommendation=alert.recommendation_hint,
            )
            for alert in case.alerts
        ],
        score=(
            CaseScoreDto(
                value=case.score_result.score_value,
                category=case.score_result.risk_category.value,
                confidence=case.score_result.confidence,
                modelVersion=case.score_result.model_version,
                topFactors=case.score_result.top_factors,
                featureContributions=case.score_result.feature_contributions,
            )
            if case.score_result
            else None
        ),
        reasoning=(
            CaseReasoningDto(
                reasoningSummary=case.reasoning_result.metadata.get("reasoningSummary", case.reasoning_result.summary),
                summary=case.reasoning_result.summary,
                hypothesis=case.reasoning_result.hypothesis,
                evidenceForReview=case.reasoning_result.evidence_for_review,
                evidenceAgainstFraud=case.reasoning_result.evidence_against_fraud,
                inconsistencies=case.reasoning_result.inconsistencies,
                missingEvidence=case.reasoning_result.missing_evidence,
                suggestedPriority=case.reasoning_result.suggested_priority,
                suggestedNextChecks=case.reasoning_result.suggested_next_checks,
                confidence=case.reasoning_result.confidence,
                unresolvedQuestions=case.reasoning_result.unresolved_questions,
            )
            if case.reasoning_result
            else None
        ),
        finalAssessment=(
            CaseFinalAssessmentDto(
                finalStatus=case.final_assessment.final_status,
                finalPriority=case.final_assessment.final_priority,
                recommendedAction=case.final_assessment.recommended_action.value,
                confidence=case.final_assessment.confidence,
                summaryForAnalyst=case.final_assessment.summary_for_analyst,
                evidenceQuality=case.final_assessment.evidence_quality,
                requiresManualReview=case.final_assessment.requires_manual_review,
                blockedByHardRules=case.final_assessment.blocked_by_hard_rules,
                hardRuleReasons=case.final_assessment.hard_rule_reasons,
            )
            if case.final_assessment
            else None
        ),
        decision=(
            CaseDecisionDto(
                decisionId=case.latest_decision.decision_id,
                caseId=case.latest_decision.case_id,
                status=case.latest_decision.status.value,
                decidedAt=case.latest_decision.created_at.isoformat(),
                decidedById=case.latest_decision.actor_id,
                decidedBy=case.latest_decision.actor_name,
                decidedByRole=case.latest_decision.actor_role,
                comment=case.latest_decision.comment,
                rationale=case.latest_decision.rationale,
                supersedesDecisionId=case.latest_decision.supersedes_decision_id,
                workflowStatus=str(case.metadata.get("workflowStatus")) if case.metadata.get("workflowStatus") else None,
            )
            if case.latest_decision
            else None
        ),
        decisionHistory=_map_decision_history(case),
    )


@router.get("/{case_id}/graph", response_model=CaseGraphResponseDto)
def get_case_graph(case_id: str) -> CaseGraphResponseDto:
    case = _case_service.get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")

    graph = case.relationship_graph
    if graph is None:
        return CaseGraphResponseDto(caseId=case_id, nodes=[], edges=[], signals=[])

    return CaseGraphResponseDto(
        caseId=case.case_id,
        nodes=[
            CaseGraphNodeDto(
                id=node.node_id,
                label=node.label,
                type=node.node_type,
                riskLevel=node.risk_level,
                metadata=node.metadata,
            )
            for node in graph.nodes
        ],
        edges=[
            CaseGraphEdgeDto(
                id=edge.edge_id,
                source=edge.source,
                target=edge.target,
                relationshipType=edge.relationship_type,
                severity=edge.severity,
            )
            for edge in graph.edges
        ],
        signals=[
            CaseGraphSignalDto(
                code=signal.code,
                severity=signal.severity,
                message=signal.message,
                relatedCaseIds=signal.related_case_ids,
            )
            for signal in graph.signals
        ],
    )


@router.post("/{case_id}/decision", response_model=CaseDecisionDto)
def decide_case(case_id: str, payload: CaseDecisionRequestDto) -> CaseDecisionDto:
    try:
        case = _case_decision_service.record_decision(
            case_id=case_id,
            action=payload.action,
            comment=payload.comment,
            actor_id=payload.actorId,
            actor_name=payload.actorName,
            actor_role=payload.actorRole,
        )
    except CaseDecisionError as exc:
        message = str(exc)
        status_code = 404 if "not found" in message.lower() else 400
        raise HTTPException(status_code=status_code, detail=message) from exc

    if case.latest_decision is None:
        raise HTTPException(status_code=500, detail="Decision not persisted.")

    return CaseDecisionDto(
        decisionId=case.latest_decision.decision_id,
        caseId=case.latest_decision.case_id,
        status=case.latest_decision.status.value,
        decidedAt=case.latest_decision.created_at.isoformat(),
        decidedById=case.latest_decision.actor_id,
        decidedBy=case.latest_decision.actor_name,
        decidedByRole=case.latest_decision.actor_role,
        comment=case.latest_decision.comment,
        rationale=case.latest_decision.rationale,
        supersedesDecisionId=case.latest_decision.supersedes_decision_id,
        workflowStatus=str(case.metadata.get("workflowStatus")) if case.metadata.get("workflowStatus") else None,
    )
