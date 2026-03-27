from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class DemoReasoningSignal:
    code: str
    severity: str
    message: str


@dataclass(slots=True)
class DemoReasoningEvidence:
    title: str
    summary: str
    source_type: str
    quality_score: float | None = None


@dataclass(slots=True)
class DemoReasoningRequest:
    case_id: str
    provider_statuses: dict[str, str] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
    hard_rule_findings: list[DemoReasoningSignal] = field(default_factory=list)
    alerts: list[DemoReasoningSignal] = field(default_factory=list)
    evidences: list[DemoReasoningEvidence] = field(default_factory=list)
    identity_verified: bool = False
    identity_inconsistencies: list[str] = field(default_factory=list)
    debt_ratio: float | None = None
    bounced_checks: int | None = None
    registered_employees: int | None = None


@dataclass(slots=True)
class DemoReasoningOutput:
    reasoning_summary: str
    hypothesis: str
    evidence_for_review: list[str]
    evidence_against_fraud: list[str]
    inconsistencies: list[str]
    missing_evidence: list[str]
    suggested_priority: str
    suggested_next_checks: list[str]
    confidence: float
    unresolved_questions: list[str]


class DemoReasoningEngine:
    def generate(self, request: DemoReasoningRequest) -> DemoReasoningOutput:
        evidence_for_review: list[str] = []
        evidence_against_fraud: list[str] = []
        inconsistencies: list[str] = []
        missing_evidence: list[str] = []
        suggested_next_checks: list[str] = []

        for signal in request.alerts:
            if signal.severity in {"CRITICAL", "WARNING"}:
                evidence_for_review.append(signal.message)

        for finding in request.hard_rule_findings:
            if finding.code not in {"INSUFFICIENT_DATA", "CRITICAL_PROVIDER_UNAVAILABLE"}:
                inconsistencies.append(finding.message)

        for issue in request.identity_inconsistencies:
            inconsistencies.append(f"Inconsistencia de identidad: {issue}.")

        for warning in request.warnings:
            missing_evidence.append(warning)

        for provider_type, status in request.provider_statuses.items():
            if status in {"disabled", "timeout", "technical_error", "insufficient"}:
                missing_evidence.append(f"Provider {provider_type} en estado {status}.")
            elif status == "partial":
                missing_evidence.append(f"Provider {provider_type} devolvio respuesta parcial.")

        if request.identity_verified and not request.identity_inconsistencies:
            evidence_against_fraud.append("La identidad fue verificada sin inconsistencias fuertes.")
        if request.debt_ratio is not None and request.debt_ratio < 0.35:
            evidence_against_fraud.append("El ratio deuda/ingresos no muestra tension relevante.")
        if request.bounced_checks == 0:
            evidence_against_fraud.append("No hay cheques rechazados en el enrichment demo.")
        if request.registered_employees is not None:
            evidence_against_fraud.append("La fuente laboral/fiscal devolvio dotacion registrada.")
        if request.registered_employees is None:
            missing_evidence.append("Falta confirmacion de empleados registrados.")

        for evidence in request.evidences:
            if evidence.source_type in {"FINANCIAL", "LABOR_FISCAL"} and evidence.quality_score and evidence.quality_score >= 0.8:
                evidence_for_review.append(f"{evidence.title}: {evidence.summary}")

        evidence_for_review = self._unique(evidence_for_review)[:5]
        evidence_against_fraud = self._unique(evidence_against_fraud)[:5]
        inconsistencies = self._unique(inconsistencies)[:5]
        missing_evidence = self._unique(missing_evidence)[:5]

        if inconsistencies or any(status in {"timeout", "technical_error"} for status in request.provider_statuses.values()):
            suggested_priority = "HIGH"
        elif len(evidence_for_review) >= 2 or missing_evidence:
            suggested_priority = "MEDIUM"
        else:
            suggested_priority = "LOW"

        if inconsistencies:
            suggested_next_checks.append("Validar manualmente las inconsistencias de identidad o cruce de fuentes.")
        if missing_evidence:
            suggested_next_checks.append("Completar o reintentar enrichment demo antes de profundizar el analisis.")
        if request.debt_ratio is not None and request.debt_ratio >= 0.45:
            suggested_next_checks.append("Revisar capacidad financiera y consistencia entre deuda e ingresos.")
        if not suggested_next_checks:
            suggested_next_checks.append("Continuar con scoring y monitorear factores influyentes del caso.")

        unresolved_questions = list(missing_evidence)
        reasoning_summary = (
            "Reasoning demo contextual generado con "
            f"{len(evidence_for_review)} senales para revision, "
            f"{len(evidence_against_fraud)} atenuantes y "
            f"{len(missing_evidence)} faltantes de evidencia."
        )
        hypothesis = (
            "El caso puede continuar con evaluacion contextual basada en evidencia demo interna, "
            "priorizando consistencia operativa, calidad de enrichment y senales financieras."
        )
        confidence = 0.86 if suggested_priority == "LOW" else 0.78 if suggested_priority == "MEDIUM" else 0.7

        return DemoReasoningOutput(
            reasoning_summary=reasoning_summary,
            hypothesis=hypothesis,
            evidence_for_review=evidence_for_review,
            evidence_against_fraud=evidence_against_fraud,
            inconsistencies=inconsistencies,
            missing_evidence=missing_evidence,
            suggested_priority=suggested_priority,
            suggested_next_checks=self._unique(suggested_next_checks)[:4],
            confidence=confidence,
            unresolved_questions=unresolved_questions,
        )

    def _unique(self, items: list[str]) -> list[str]:
        seen: set[str] = set()
        ordered: list[str] = []
        for item in items:
            normalized = item.strip()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            ordered.append(normalized)
        return ordered
