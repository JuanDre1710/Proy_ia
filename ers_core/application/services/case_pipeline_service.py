from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from typing import Any
from uuid import uuid4

from ers_core.adapters.anti_corruption.external_to_domain import MappingContext
from ers_core.adapters.anti_corruption.financial_demo_normalizer import FinancialDemoPayloadNormalizer
from ers_core.adapters.anti_corruption.identity_normalizer import IdentityPayloadNormalizer
from ers_core.adapters.anti_corruption.labor_demo_normalizer import LaborDemoPayloadNormalizer
from ers_core.adapters.providers.errors import ProviderIntegrationError
from ers_core.application.ports.case_repository import CaseRepository
from ers_core.application.ports.integration_repository import AuditLogRepository
from ers_core.application.ports.provider_ports import ProviderRequest
from ers_core.application.services.reasoning_service import ReasoningService
from ers_core.application.services.final_assessment_builder import FinalAssessmentBuilder
from ers_core.application.services.relationship_service import RelationshipService
from ers_core.application.services.rule_engine import RuleEngine
from ers_core.application.services.tabular_scoring_service import TabularScoringService
from ers_core.domain.enums import (
    AlertSeverity,
    AuditActionType,
    AuditResultType,
    CaseProcessingState,
    EvidenceSourceType,
    ProviderType,
)
from ers_core.domain.models import (
    Alert,
    AuditLog,
    Case,
    ConsolidatedEvidence,
    HardRuleFinding,
    Person,
)


class CasePipelineService:
    def __init__(
        self,
        case_repository: CaseRepository,
        audit_repository: AuditLogRepository,
        integration_manager: Any,
    ) -> None:
        self._case_repository = case_repository
        self._audit_repository = audit_repository
        self._integration_manager = integration_manager
        self._identity_normalizer = IdentityPayloadNormalizer()
        self._financial_normalizer = FinancialDemoPayloadNormalizer()
        self._labor_normalizer = LaborDemoPayloadNormalizer()
        self._rule_engine = RuleEngine()
        self._reasoning_service = ReasoningService()
        self._scoring_service = TabularScoringService()
        self._relationship_service = RelationshipService()
        self._final_assessment_builder = FinalAssessmentBuilder()

    def consolidate_case_evidence(self, case: Case) -> Case:
        if case.processing_state != CaseProcessingState.ACCEPTED_FOR_PROCESSING:
            return case

        now = datetime.utcnow()
        provider_statuses: dict[str, str] = {}
        warnings: list[str] = []
        evidences = list(case.evidences)
        alerts = list(case.alerts)
        subject = case.subject
        identity_status = case.identity_status
        financial_info = case.financial_info
        labor_fiscal_info = case.labor_fiscal_info

        request = ProviderRequest(
            subject_identifier=case.subject.document_number,
            identifier_type=case.subject.document_type.value,
            case_id=case.case_id,
            context={"requestedBy": case.requested_by, "sourceChannel": case.source_channel},
        )

        identity_integration = self._resolve_active_integration(ProviderType.IDENTITY)
        if identity_integration is None:
            provider_statuses[ProviderType.IDENTITY.value] = "disabled"
            warnings.append("No hay proveedor de identidad activo.")
        else:
            try:
                adapter = self._integration_manager.resolve_provider(identity_integration.integration_id)
                payload = adapter.fetch_identity(request, identity_integration)
                provider_statuses[ProviderType.IDENTITY.value] = str(payload.metadata.get("status", "ok"))
                normalized = self._identity_normalizer.normalize(
                    payload,
                    MappingContext(
                        provider_code=payload.provider_code,
                        integration_id=identity_integration.integration_id,
                        collected_at=now,
                        metadata={"caseId": case.case_id},
                    ),
                )
                subject = self._merge_subject(subject, self._identity_normalizer.normalize_subject(payload))
                identity_status = normalized.identity_status or identity_status
                evidences.extend(normalized.evidences)
                alerts.extend(normalized.alerts)
                warnings.extend(normalized.quality_warnings)
                self._audit_pipeline_step(
                    action=AuditActionType.INTEGRATION_CONSUMED,
                    result=AuditResultType.OK,
                    case=case,
                    detail=f"Identity provider consumed: {payload.provider_code}",
                    metadata={"providerType": ProviderType.IDENTITY.value, "providerStatus": provider_statuses[ProviderType.IDENTITY.value]},
                )
            except ProviderIntegrationError as exc:
                provider_statuses[ProviderType.IDENTITY.value] = exc.code
                warnings.append(str(exc))
                alerts.append(self._build_provider_alert(case.case_id, ProviderType.IDENTITY.value, exc.code, str(exc)))
                self._audit_pipeline_step(
                    action=AuditActionType.INTEGRATION_CONSUMED,
                    result=AuditResultType.ERROR,
                    case=case,
                    detail=f"Identity provider error: {exc.code}",
                    metadata={"providerType": ProviderType.IDENTITY.value, "providerStatus": exc.code},
                )

        financial_integration = self._resolve_active_integration(ProviderType.FINANCIAL)
        if financial_integration is None:
            provider_statuses[ProviderType.FINANCIAL.value] = "disabled"
            warnings.append("No hay proveedor financiero activo.")
        else:
            try:
                adapter = self._integration_manager.resolve_provider(financial_integration.integration_id)
                payload = adapter.fetch_financial_profile(request, financial_integration)
                provider_statuses[ProviderType.FINANCIAL.value] = str(payload.metadata.get("status", "ok"))
                normalized = self._financial_normalizer.normalize(
                    payload,
                    MappingContext(
                        provider_code=payload.provider_code,
                        integration_id=financial_integration.integration_id,
                        collected_at=now,
                        metadata={"caseId": case.case_id},
                    ),
                )
                financial_info = normalized.financial_info or financial_info
                labor_fiscal_info = normalized.labor_fiscal_info or labor_fiscal_info
                evidences.extend(normalized.evidences)
                alerts.extend(normalized.alerts)
                warnings.extend(normalized.quality_warnings)
                self._audit_pipeline_step(
                    action=AuditActionType.INTEGRATION_CONSUMED,
                    result=AuditResultType.OK,
                    case=case,
                    detail=f"Financial provider consumed: {payload.provider_code}",
                    metadata={"providerType": ProviderType.FINANCIAL.value, "providerStatus": provider_statuses[ProviderType.FINANCIAL.value]},
                )
            except ProviderIntegrationError as exc:
                provider_statuses[ProviderType.FINANCIAL.value] = exc.code
                warnings.append(str(exc))
                alerts.append(self._build_provider_alert(case.case_id, ProviderType.FINANCIAL.value, exc.code, str(exc)))
                self._audit_pipeline_step(
                    action=AuditActionType.INTEGRATION_CONSUMED,
                    result=AuditResultType.ERROR,
                    case=case,
                    detail=f"Financial provider error: {exc.code}",
                    metadata={"providerType": ProviderType.FINANCIAL.value, "providerStatus": exc.code},
                )

        labor_integration = self._resolve_active_integration(ProviderType.LABOR_FISCAL)
        if labor_integration is None:
            provider_statuses[ProviderType.LABOR_FISCAL.value] = "disabled"
            warnings.append("No hay proveedor laboral/fiscal activo. Se continua con enrichment demo minimo.")
        else:
            try:
                adapter = self._integration_manager.resolve_provider(labor_integration.integration_id)
                payload = adapter.fetch_labor_fiscal_profile(request, labor_integration)
                provider_statuses[ProviderType.LABOR_FISCAL.value] = str(payload.metadata.get("status", "ok"))
                normalized = self._labor_normalizer.normalize(
                    payload,
                    MappingContext(
                        provider_code=payload.provider_code,
                        integration_id=labor_integration.integration_id,
                        collected_at=now,
                        metadata={"caseId": case.case_id},
                    ),
                )
                labor_fiscal_info = normalized.labor_fiscal_info or labor_fiscal_info
                evidences.extend(normalized.evidences)
                alerts.extend(normalized.alerts)
                warnings.extend(normalized.quality_warnings)
                self._audit_pipeline_step(
                    action=AuditActionType.INTEGRATION_CONSUMED,
                    result=AuditResultType.OK,
                    case=case,
                    detail=f"Labor/fiscal provider consumed: {payload.provider_code}",
                    metadata={"providerType": ProviderType.LABOR_FISCAL.value, "providerStatus": provider_statuses[ProviderType.LABOR_FISCAL.value]},
                )
            except ProviderIntegrationError as exc:
                provider_statuses[ProviderType.LABOR_FISCAL.value] = exc.code
                warnings.append(str(exc))
                alerts.append(self._build_provider_alert(case.case_id, ProviderType.LABOR_FISCAL.value, exc.code, str(exc)))
                self._audit_pipeline_step(
                    action=AuditActionType.INTEGRATION_CONSUMED,
                    result=AuditResultType.ERROR,
                    case=case,
                    detail=f"Labor/fiscal provider error: {exc.code}",
                    metadata={"providerType": ProviderType.LABOR_FISCAL.value, "providerStatus": exc.code},
                )

        ready_for_rules = self._is_ready_for_rules(provider_statuses)
        next_state = CaseProcessingState.READY_FOR_RULES if ready_for_rules else CaseProcessingState.WAITING_FOR_ENRICHMENT
        consolidated_evidence = ConsolidatedEvidence(
            bundle_id=f"EVB-{case.case_id}",
            collected_at=now,
            ready_for_rules=ready_for_rules,
            provider_statuses=provider_statuses,
            warnings=warnings,
            evidence_ids=[item.evidence_id for item in evidences],
            metadata={"evidenceCount": len(evidences)},
        )

        updated_case = replace(
            case,
            updated_at=now,
            processing_state=next_state,
            subject=subject,
            identity_status=identity_status,
            financial_info=financial_info,
            labor_fiscal_info=labor_fiscal_info,
            evidences=evidences,
            alerts=alerts if alerts else [self._build_ready_alert(case.case_id, ready_for_rules)],
            reasoning_result=None,
            score_result=None,
            final_assessment=None,
            consolidated_evidence=consolidated_evidence,
            hard_rule_evaluation=None,
            tags=["evidence-consolidated"] if ready_for_rules else ["evidence-partial"],
            metadata={
                **case.metadata,
                "pipelineStage": "evidence_consolidation",
                "consolidatedAt": now.isoformat(),
            },
        )
        ruled_case = self.apply_hard_rules(updated_case)
        reasoned_case = self.apply_reasoning(ruled_case)
        scored_case = self.apply_scoring(reasoned_case)
        related_case = self.apply_relationships(scored_case)
        assessed_case = self.apply_final_assessment(related_case)
        saved = self._case_repository.save(assessed_case)
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-CASE-EVIDENCE-{case.case_id}-{int(now.timestamp())}",
                action=AuditActionType.CASE_EVALUATED,
                result=AuditResultType.OK if saved.processing_state == CaseProcessingState.READY_FOR_REASONING else AuditResultType.OBSERVED,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=case.requested_by,
                actor_role=None,
                correlation_id=None,
                detail="Case evidence consolidation and hard-rule evaluation completed",
                metadata={
                    "processingState": saved.processing_state.value,
                    "providerStatuses": provider_statuses,
                    "warnings": warnings,
                },
            )
        )
        return saved

    def apply_hard_rules(self, case: Case) -> Case:
        evaluation = self._rule_engine.evaluate(case)
        next_state = self._rule_engine.resolve_processing_state(case, evaluation)
        alerts = list(case.alerts)
        alerts.extend(self._build_rule_alerts(case.case_id, evaluation.findings))
        self._audit_pipeline_step(
            action=AuditActionType.HARD_RULES_EXECUTED,
            result=AuditResultType.BLOCKED if next_state == CaseProcessingState.EXCLUDED else AuditResultType.OK,
            case=case,
            detail=f"Hard rules evaluated with effect {evaluation.final_effect}",
            metadata={"findings": [item.code for item in evaluation.findings], "nextState": next_state.value},
        )

        analyst_summary = self._build_pipeline_summary(evaluation)
        return replace(
            case,
            processing_state=next_state,
            alerts=alerts,
            hard_rule_evaluation=evaluation,
            metadata={
                **case.metadata,
                "pipelineStage": "hard_rules",
                "hardRulesEvaluatedAt": evaluation.evaluated_at.isoformat(),
                "hardRuleFinalEffect": evaluation.final_effect,
                "analystSummary": analyst_summary,
            },
            tags=self._merge_tags(case.tags, next_state),
        )

    def apply_reasoning(self, case: Case) -> Case:
        if case.processing_state != CaseProcessingState.READY_FOR_REASONING:
            return case

        reasoning = self._reasoning_service.reason(case)
        self._audit_pipeline_step(
            action=AuditActionType.REASONING_EXECUTED,
            result=AuditResultType.OK,
            case=case,
            detail="Contextual reasoning executed",
            metadata={"reasoningId": reasoning.reasoning_id, "suggestedPriority": reasoning.suggested_priority},
        )
        return replace(
            case,
            reasoning_result=reasoning,
            metadata={
                **case.metadata,
                "pipelineStage": "reasoning",
                "reasoningGeneratedAt": reasoning.generated_at.isoformat(),
                "analystSummary": reasoning.summary,
            },
            tags=[item for item in case.tags if item != "ready-for-reasoning"] + ["reasoning-complete"],
        )

    def apply_scoring(self, case: Case) -> Case:
        if case.processing_state != CaseProcessingState.READY_FOR_REASONING or case.reasoning_result is None:
            return case

        score_result = self._scoring_service.score_case(case)
        self._audit_pipeline_step(
            action=AuditActionType.SCORING_EXECUTED,
            result=AuditResultType.OK,
            case=case,
            detail="Tabular scoring executed",
            metadata={"scoreId": score_result.score_id, "riskCategory": score_result.risk_category.value},
        )
        return replace(
            case,
            processing_state=CaseProcessingState.SCORED,
            score_result=score_result,
            metadata={
                **case.metadata,
                "pipelineStage": "scoring",
                "scoredAt": score_result.evaluated_at.isoformat(),
                "modelVersion": score_result.model_version,
            },
            tags=[item for item in case.tags if item != "reasoning-complete"] + ["scored"],
        )

    def apply_relationships(self, case: Case) -> Case:
        if case.processing_state not in {CaseProcessingState.SCORED, CaseProcessingState.READY_FOR_REASONING}:
            return case

        peer_cases = self._case_repository.list_all()
        graph = self._relationship_service.build_graph(case, peer_cases)
        alerts = list(case.alerts)
        alerts.extend(self._build_relationship_alerts(case.case_id, graph.signals))
        analyst_summary = self._merge_relationship_summary(case.metadata.get("analystSummary"), graph.signals)
        return replace(
            case,
            relationship_graph=graph,
            alerts=alerts,
            metadata={
                **case.metadata,
                "pipelineStage": "relationships",
                "relationshipGraphGeneratedAt": graph.generated_at.isoformat(),
                "analystSummary": analyst_summary,
            },
            tags=[item for item in case.tags if item != "scored"] + ["relationships-built"],
        )

    def apply_final_assessment(self, case: Case) -> Case:
        assessment = self._final_assessment_builder.build(case)
        if assessment is None:
            return case

        self._audit_pipeline_step(
            action=AuditActionType.FINAL_ASSESSMENT_GENERATED,
            result=AuditResultType.OK,
            case=case,
            detail=f"Final assessment generated with status {assessment.final_status}",
            metadata={
                "assessmentId": assessment.assessment_id,
                "finalStatus": assessment.final_status,
                "finalPriority": assessment.final_priority,
                "recommendedAction": assessment.recommended_action.value,
            },
        )

        return replace(
            case,
            final_assessment=assessment,
            metadata={
                **case.metadata,
                "pipelineStage": "final_assessment",
                "finalAssessedAt": assessment.created_at.isoformat(),
                "analystSummary": assessment.summary_for_analyst,
            },
            tags=[item for item in case.tags if item != "relationships-built"] + ["final-assessment-ready"],
        )

    def _resolve_active_integration(self, provider_type: ProviderType) -> Any | None:
        integrations = self._integration_manager.list_active_integrations(provider_type)
        return integrations[0] if integrations else None

    def _merge_subject(self, current: Person, normalized: dict[str, Any]) -> Person:
        return replace(
            current,
            full_name=str(normalized.get("full_name") or current.full_name),
            birth_date=normalized.get("birth_date") or current.birth_date,
            age=normalized.get("age") or current.age,
            email=normalized.get("email") or current.email,
            phone=normalized.get("phone") or current.phone,
            address=normalized.get("address") or current.address,
            locality=normalized.get("locality") or current.locality,
            province=normalized.get("province") or current.province,
            metadata={"ingestionOnly": False, "normalized": True},
        )

    def _is_ready_for_rules(self, provider_statuses: dict[str, str]) -> bool:
        accepted_statuses = {"ok", "partial"}
        return (
            provider_statuses.get(ProviderType.IDENTITY.value) in accepted_statuses
            and provider_statuses.get(ProviderType.FINANCIAL.value) in accepted_statuses
        )

    def _build_provider_alert(self, case_id: str, provider_type: str, code: str, detail: str) -> Alert:
        return Alert(
            alert_id=f"ALT-{provider_type}-{case_id}",
            severity=AlertSeverity.WARNING,
            title=f"Proveedor {provider_type} observado",
            short_description=f"Estado {code}.",
            detail=detail,
            source_type=EvidenceSourceType.SYSTEM,
            source_reference=provider_type,
            related_variable="provider_status",
            recommendation_hint="Reintentar enrichment antes de reglas duras.",
            evidence_ids=[],
        )

    def _audit_pipeline_step(
        self,
        *,
        action: AuditActionType,
        result: AuditResultType,
        case: Case,
        detail: str,
        metadata: dict[str, Any],
    ) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-{uuid4().hex[:10].upper()}",
                action=action,
                result=result,
                entity_type="Case",
                entity_id=case.case_id,
                actor_id=case.requested_by,
                actor_role=None,
                correlation_id=case.case_id,
                detail=detail,
                metadata=metadata,
            )
        )

    def _build_ready_alert(self, case_id: str, ready_for_rules: bool) -> Alert:
        if ready_for_rules:
            return Alert(
                alert_id=f"ALT-EVIDENCE-{case_id}",
                severity=AlertSeverity.INFO,
                title="Evidencia consolidada",
                short_description="El caso quedo listo para reglas duras.",
                detail="Se consolidaron fuentes demo internas de identidad y enrichment financiero/laboral.",
                source_type=EvidenceSourceType.SYSTEM,
                source_reference="pipeline",
                related_variable="evidence_bundle",
                recommendation_hint="Continuar con reglas duras.",
                evidence_ids=[],
            )
        return Alert(
            alert_id=f"ALT-EVIDENCE-{case_id}",
            severity=AlertSeverity.WARNING,
            title="Evidencia incompleta",
            short_description="El caso aun no esta listo para reglas duras.",
            detail="Se requiere completar enrichment antes de continuar.",
            source_type=EvidenceSourceType.SYSTEM,
            source_reference="pipeline",
            related_variable="evidence_bundle",
            recommendation_hint="Resolver proveedores observados o faltantes.",
            evidence_ids=[],
        )

    def _build_rule_alerts(self, case_id: str, findings: list[HardRuleFinding]) -> list[Alert]:
        alerts: list[Alert] = []
        for finding in findings:
            severity = AlertSeverity.CRITICAL if finding.severity == "CRITICAL" else AlertSeverity.WARNING
            alerts.append(
                Alert(
                    alert_id=f"ALT-RULE-{finding.code}-{case_id}",
                    severity=severity,
                    title=finding.message,
                    short_description=finding.code,
                    detail=f"{finding.justification} Efecto: {finding.effect_on_pipeline}.",
                    source_type=EvidenceSourceType.INTERNAL_RULE,
                    source_reference=finding.code,
                    related_variable="hard_rule",
                    recommendation_hint="Revisar evidencia y politica aplicadas antes de continuar.",
                    evidence_ids=finding.evidence_refs,
                )
            )
        return alerts

    def _build_pipeline_summary(self, evaluation: Any) -> str:
        if evaluation.final_effect == "exclude_case":
            return "Las reglas duras excluyeron el caso antes de reasoning y scoring."
        if evaluation.final_effect == "mark_not_evaluable":
            return "Las reglas duras marcaron el caso como no evaluable por cobertura o calidad insuficiente."
        return "Las reglas duras no bloquearon el caso. El expediente queda listo para reasoning."

    def _merge_tags(self, current_tags: list[str], next_state: CaseProcessingState) -> list[str]:
        tags = [item for item in current_tags if item not in {"evidence-consolidated", "evidence-partial"}]
        if next_state == CaseProcessingState.EXCLUDED:
            tags.append("hard-rules-excluded")
        elif next_state == CaseProcessingState.NOT_EVALUABLE:
            tags.append("hard-rules-not-evaluable")
        else:
            tags.append("ready-for-reasoning")
        return tags

    def _build_relationship_alerts(self, case_id: str, signals: list[Any]) -> list[Alert]:
        alerts: list[Alert] = []
        for signal in signals:
            severity = AlertSeverity.CRITICAL if signal.severity == "CRITICAL" else AlertSeverity.WARNING
            alerts.append(
                Alert(
                    alert_id=f"ALT-REL-{signal.code}-{case_id}",
                    severity=severity,
                    title=signal.message,
                    short_description=signal.code,
                    detail=f"Casos relacionados: {', '.join(signal.related_case_ids) if signal.related_case_ids else 'sin detalle'}",
                    source_type=EvidenceSourceType.RELATIONSHIP,
                    source_reference=signal.code,
                    related_variable="relationship_signal",
                    recommendation_hint="Inspeccionar la red de relaciones antes de resolver el caso.",
                    evidence_ids=[],
                )
            )
        return alerts

    def _merge_relationship_summary(self, current_summary: Any, signals: list[Any]) -> str:
        base = current_summary if isinstance(current_summary, str) else ""
        if not signals:
            return base
        relation_summary = f"Se detectaron {len(signals)} senales relacionales relevantes."
        return f"{base} {relation_summary}".strip()
