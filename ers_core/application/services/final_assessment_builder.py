from __future__ import annotations

from datetime import datetime

from ers_core.domain.enums import CaseProcessingState, RecommendationType, RiskCategory
from ers_core.domain.models import Case, FinalAssessment


class FinalAssessmentBuilder:
    def build(self, case: Case) -> FinalAssessment | None:
        if case.processing_state not in {
            CaseProcessingState.EXCLUDED,
            CaseProcessingState.NOT_EVALUABLE,
            CaseProcessingState.SCORED,
        }:
            return None

        hard_reasons = [item.message for item in (case.hard_rule_evaluation.findings if case.hard_rule_evaluation else [])]
        blocked = case.processing_state == CaseProcessingState.EXCLUDED
        evidence_quality = self._resolve_evidence_quality(case)
        risk_category = self._resolve_risk_category(case)
        final_status = self._resolve_final_status(case)
        final_priority = self._resolve_final_priority(case)
        recommendation = self._resolve_recommendation(case, risk_category)
        confidence = self._resolve_confidence(case, evidence_quality)
        summary = self._build_summary(case, final_status, final_priority, recommendation, evidence_quality)

        return FinalAssessment(
            assessment_id=f"FAS-{case.case_id}",
            case_id=case.case_id,
            risk_category=risk_category,
            recommendation=recommendation,
            executive_summary=summary,
            requires_manual_review=True,
            blocked_by_hard_rules=blocked,
            final_status=final_status,
            final_priority=final_priority,
            recommended_action=recommendation,
            confidence=confidence,
            summary_for_analyst=summary,
            evidence_quality=evidence_quality,
            pipeline_state=case.processing_state.value,
            hard_rule_reasons=hard_reasons,
            alert_ids=[item.alert_id for item in case.alerts],
            reasoning_result_id=case.reasoning_result.reasoning_id if case.reasoning_result else None,
            score_result_id=case.score_result.score_id if case.score_result else None,
            metadata={
                "alertCount": len(case.alerts),
                "evidenceCount": len(case.evidences),
                "relationshipSignals": len(case.relationship_graph.signals) if case.relationship_graph else 0,
                "providerStatuses": case.consolidated_evidence.provider_statuses if case.consolidated_evidence else {},
                "generatedAt": datetime.utcnow().isoformat(),
            },
        )

    def _resolve_risk_category(self, case: Case) -> RiskCategory:
        if case.processing_state in {CaseProcessingState.EXCLUDED, CaseProcessingState.NOT_EVALUABLE}:
            return RiskCategory.NOT_EVALUABLE
        if case.score_result is None:
            return RiskCategory.REQUIRES_REVIEW
        return case.score_result.risk_category

    def _resolve_final_status(self, case: Case) -> str:
        if case.processing_state == CaseProcessingState.EXCLUDED:
            return "EXCLUDED"
        if case.processing_state == CaseProcessingState.NOT_EVALUABLE:
            return "NOT_EVALUABLE"
        if case.score_result and case.score_result.risk_category == RiskCategory.FRAUD_SUSPECT:
            return "REVIEW_REQUIRED"
        if case.score_result and case.score_result.risk_category == RiskCategory.REQUIRES_REVIEW:
            return "REVIEW_REQUIRED"
        return "READY_FOR_DECISION"

    def _resolve_final_priority(self, case: Case) -> str:
        if case.processing_state == CaseProcessingState.EXCLUDED:
            return "CRITICAL"
        if case.processing_state == CaseProcessingState.NOT_EVALUABLE:
            return "HIGH"
        if case.reasoning_result and case.reasoning_result.suggested_priority:
            return case.reasoning_result.suggested_priority
        if case.score_result and case.score_result.risk_category == RiskCategory.FRAUD_SUSPECT:
            return "HIGH"
        return "MEDIUM"

    def _resolve_recommendation(self, case: Case, risk_category: RiskCategory) -> RecommendationType:
        if case.processing_state == CaseProcessingState.EXCLUDED:
            return RecommendationType.BLOCK
        if case.processing_state == CaseProcessingState.NOT_EVALUABLE:
            return RecommendationType.REQUEST_MORE_INFORMATION
        if risk_category == RiskCategory.FRAUD_SUSPECT:
            return RecommendationType.ESCALATE
        if risk_category == RiskCategory.REQUIRES_REVIEW:
            return RecommendationType.REVIEW
        return RecommendationType.APPROVE

    def _resolve_evidence_quality(self, case: Case) -> str:
        if case.consolidated_evidence is None:
            return "LOW"

        provider_statuses = set(case.consolidated_evidence.provider_statuses.values())
        warnings = case.consolidated_evidence.warnings
        if provider_statuses <= {"ok"} and not warnings:
            return "HIGH"
        if "timeout" in provider_statuses or "technical_error" in provider_statuses:
            return "LOW"
        return "MEDIUM"

    def _resolve_confidence(self, case: Case, evidence_quality: str) -> float:
        base = 0.5
        if case.score_result and case.score_result.confidence is not None:
            base = case.score_result.confidence
        elif case.reasoning_result and case.reasoning_result.confidence is not None:
            base = case.reasoning_result.confidence

        quality_boost = {"HIGH": 0.15, "MEDIUM": 0.05, "LOW": -0.1}[evidence_quality]
        blocked_boost = 0.2 if case.processing_state == CaseProcessingState.EXCLUDED else 0.0
        return max(0.05, min(0.99, round(base + quality_boost + blocked_boost, 2)))

    def _build_summary(
        self,
        case: Case,
        final_status: str,
        final_priority: str,
        recommendation: RecommendationType,
        evidence_quality: str,
    ) -> str:
        if case.processing_state == CaseProcessingState.EXCLUDED:
            reasons = ", ".join(item.message for item in case.hard_rule_evaluation.findings[:2]) if case.hard_rule_evaluation else "reglas duras"
            return (
                f"Caso excluido por {reasons}. "
                f"Prioridad {final_priority}. Accion sugerida: {recommendation.value}. Calidad de evidencia {evidence_quality}."
            )
        if case.processing_state == CaseProcessingState.NOT_EVALUABLE:
            return (
                f"Caso no evaluable por cobertura o calidad insuficiente. "
                f"Prioridad {final_priority}. Accion sugerida: {recommendation.value}."
            )

        score = round(case.score_result.score_value, 2) if case.score_result else 0.0
        reasoning = case.reasoning_result.summary if case.reasoning_result else "Sin reasoning estructurado."
        return (
            f"Estado final {final_status} con score {score}. "
            f"Prioridad {final_priority}. Accion sugerida: {recommendation.value}. "
            f"Calidad de evidencia {evidence_quality}. {reasoning}"
        )
