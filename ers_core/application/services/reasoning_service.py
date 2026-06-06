from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from ers_core.domain.enums import AlertSeverity
from ers_core.domain.models import Case, ReasoningResult
from ers_core.application.services.demo_reasoning_engine import (
    DemoReasoningEngine,
    DemoReasoningEvidence,
    DemoReasoningRequest,
    DemoReasoningSignal,
)


@dataclass(slots=True)
class ReasoningInput:
    case_id: str
    alerts_count: int
    evidence_count: int
    hard_rule_codes: list[str] = field(default_factory=list)
    provider_statuses: dict[str, str] = field(default_factory=dict)
    consolidated_warnings: list[str] = field(default_factory=list)


class ReasoningService:
    def __init__(self, engine: DemoReasoningEngine | None = None) -> None:
        self._engine = engine or DemoReasoningEngine()

    def build_input(self, case: Case) -> ReasoningInput:
        return ReasoningInput(
            case_id=case.case_id,
            alerts_count=len(case.alerts),
            evidence_count=len(case.evidences),
            hard_rule_codes=[item.code for item in case.hard_rule_evaluation.findings] if case.hard_rule_evaluation else [],
            provider_statuses=case.consolidated_evidence.provider_statuses if case.consolidated_evidence else {},
            consolidated_warnings=case.consolidated_evidence.warnings if case.consolidated_evidence else [],
        )

    def reason(self, case: Case) -> ReasoningResult:
        engine_request = DemoReasoningRequest(
            case_id=case.case_id,
            provider_statuses=case.consolidated_evidence.provider_statuses if case.consolidated_evidence else {},
            warnings=case.consolidated_evidence.warnings if case.consolidated_evidence else [],
            hard_rule_findings=[
                DemoReasoningSignal(code=item.code, severity=item.severity, message=item.message)
                for item in (case.hard_rule_evaluation.findings if case.hard_rule_evaluation else [])
            ],
            alerts=[
                DemoReasoningSignal(code=alert.alert_id, severity=alert.severity.value, message=alert.short_description)
                for alert in case.alerts
                if alert.severity in {AlertSeverity.CRITICAL, AlertSeverity.WARNING}
            ],
            evidences=[
                DemoReasoningEvidence(
                    title=evidence.title,
                    summary=evidence.summary,
                    source_type=evidence.source_type.value,
                    quality_score=evidence.quality_score,
                )
                for evidence in case.evidences
            ],
            identity_verified=case.identity_status.verified,
            identity_inconsistencies=list(case.identity_status.inconsistencies),
            debt_ratio=case.financial_info.debt_ratio if case.financial_info else None,
            bounced_checks=case.financial_info.bounced_checks if case.financial_info else None,
            registered_employees=case.labor_fiscal_info.registered_employees if case.labor_fiscal_info else None,
        )
        engine_output = self._engine.generate(engine_request)

        return ReasoningResult(
            reasoning_id=f"RSN-{case.case_id}",
            engine_version="demo-contextual-reasoning-v2",
            summary=engine_output.reasoning_summary,
            hypothesis=engine_output.hypothesis,
            evidence_for_review=engine_output.evidence_for_review,
            evidence_against_fraud=engine_output.evidence_against_fraud,
            inconsistencies=engine_output.inconsistencies,
            missing_evidence=engine_output.missing_evidence,
            suggested_priority=engine_output.suggested_priority,
            suggested_next_checks=engine_output.suggested_next_checks,
            supporting_evidence_ids=[item.evidence_id for item in case.evidences],
            contradictory_evidence_ids=[],
            unresolved_questions=engine_output.unresolved_questions,
            confidence=engine_output.confidence,
            generated_at=datetime.utcnow(),
            metadata={
                "alertsCount": len(case.alerts),
                "hardRuleEffect": case.hard_rule_evaluation.final_effect if case.hard_rule_evaluation else None,
                "reasoningSummary": engine_output.reasoning_summary,
                "reasoningMode": "demo_internal",
                "replaceableBy": "future_llm_reasoning_engine",
            },
        )
