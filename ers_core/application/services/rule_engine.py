from __future__ import annotations

from datetime import datetime

from ers_core.domain.enums import CaseProcessingState
from ers_core.domain.models import Case, HardRuleEvaluation, HardRuleFinding


class RuleEngine:
    def evaluate(self, case: Case) -> HardRuleEvaluation:
        findings: list[HardRuleFinding] = []

        if case.validation_results.get("daily_limit") == "reached":
            findings.append(
                HardRuleFinding(
                    code="DAILY_LIMIT_EXCEEDED",
                    severity="CRITICAL",
                    message="El usuario excedio el limite diario de evaluaciones.",
                    justification="La politica operativa bloquea nuevas evaluaciones cuando el uso diario supera el umbral.",
                    evidence_refs=[],
                    effect_on_pipeline="exclude_case",
                )
            )

        if case.identity_status.deceased:
            findings.append(
                HardRuleFinding(
                    code="SUBJECT_DECEASED",
                    severity="CRITICAL",
                    message="La persona figura como fallecida.",
                    justification="No corresponde continuar evaluacion antifraude automatizada sobre un titular fallecido.",
                    evidence_refs=[item.evidence_id for item in case.evidences if item.source_type.value == "IDENTITY"],
                    effect_on_pipeline="exclude_case",
                )
            )

        if case.processing_state == CaseProcessingState.WAITING_FOR_ENRICHMENT:
            findings.append(
                HardRuleFinding(
                    code="CRITICAL_PROVIDER_UNAVAILABLE",
                    severity="CRITICAL",
                    message="Un proveedor critico no estuvo disponible para consolidar evidencia.",
                    justification="La calidad y cobertura minima de datos no alcanza para reglas ni razonamiento confiables.",
                    evidence_refs=case.consolidated_evidence.evidence_ids if case.consolidated_evidence else [],
                    effect_on_pipeline="mark_not_evaluable",
                )
            )

        if case.financial_info is None or case.labor_fiscal_info is None or case.consolidated_evidence is None:
            findings.append(
                HardRuleFinding(
                    code="INSUFFICIENT_DATA",
                    severity="WARNING",
                    message="El caso no tiene evidencia suficiente para una evaluacion confiable.",
                    justification="Faltan bloques minimos de enrichment necesarios para continuar el pipeline.",
                    evidence_refs=case.consolidated_evidence.evidence_ids if case.consolidated_evidence else [],
                    effect_on_pipeline="mark_not_evaluable",
                )
            )

        if self._has_critical_cross_source_inconsistency(case):
            findings.append(
                HardRuleFinding(
                    code="CRITICAL_CROSS_SOURCE_INCONSISTENCY",
                    severity="CRITICAL",
                    message="Se detecto una inconsistencia critica entre fuentes.",
                    justification="La provincia declarada por el proveedor financiero no coincide con la identidad consolidada.",
                    evidence_refs=[
                        item.evidence_id
                        for item in case.evidences
                        if item.source_type.value in {"IDENTITY", "LABOR_FISCAL"}
                    ],
                    effect_on_pipeline="exclude_case",
                )
            )

        if self._is_policy_blocked(case):
            findings.append(
                HardRuleFinding(
                    code="POLICY_BLOCK",
                    severity="CRITICAL",
                    message="El caso quedo bloqueado por politica.",
                    justification="La politica vigente bloquea identificadores incluidos en lista restringida de evaluacion.",
                    evidence_refs=[],
                    effect_on_pipeline="exclude_case",
                )
            )

        final_effect = self._resolve_final_effect(findings)
        return HardRuleEvaluation(
            evaluation_id=f"HRE-{case.case_id}",
            evaluated_at=datetime.utcnow(),
            findings=findings,
            final_effect=final_effect,
            ready_for_reasoning=final_effect == "continue_to_reasoning",
            ready_for_scoring=final_effect == "continue_to_scoring",
            metadata={"findingsCount": len(findings)},
        )

    def resolve_processing_state(self, case: Case, evaluation: HardRuleEvaluation) -> CaseProcessingState:
        if evaluation.final_effect == "exclude_case":
            return CaseProcessingState.EXCLUDED
        if evaluation.final_effect == "mark_not_evaluable":
            return CaseProcessingState.NOT_EVALUABLE
        return CaseProcessingState.READY_FOR_REASONING

    def _resolve_final_effect(self, findings: list[HardRuleFinding]) -> str:
        effects = {item.effect_on_pipeline for item in findings}
        if "exclude_case" in effects:
            return "exclude_case"
        if "mark_not_evaluable" in effects:
            return "mark_not_evaluable"
        return "continue_to_reasoning"

    def _has_critical_cross_source_inconsistency(self, case: Case) -> bool:
        provider_statuses = case.consolidated_evidence.provider_statuses if case.consolidated_evidence else {}
        accepted_statuses = {"ok", "partial", "disabled"}
        if provider_statuses.get("IDENTITY") not in accepted_statuses:
            return False
        if provider_statuses.get("LABOR_FISCAL") not in accepted_statuses:
            return False
        subject_province = (case.subject.province or "").strip().lower()
        financial_province = (
            str(case.labor_fiscal_info.attributes.get("declaredProvince", "")) if case.labor_fiscal_info else ""
        ).strip().lower()
        return bool(subject_province and financial_province and subject_province != financial_province)

    def _is_policy_blocked(self, case: Case) -> bool:
        blocked_suffixes = {"66", "13"}
        identifier = case.subject.document_number.strip()
        return any(identifier.endswith(suffix) for suffix in blocked_suffixes)
