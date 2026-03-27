from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from ers_core.domain.enums import (
    AlertSeverity,
    CaseProcessingState,
    DecisionStatus,
    DocumentType,
    EvidenceQuality,
    EvidenceSourceType,
    IdentityLifecycleStatus,
    RecommendationType,
    RiskCategory,
)
from ers_core.domain.models import (
    Alert,
    Case,
    ConsolidatedEvidence,
    Decision,
    Evidence,
    FinalAssessment,
    FinancialInfo,
    HardRuleEvaluation,
    HardRuleFinding,
    IdentityStatus,
    LaborFiscalInfo,
    Person,
    RelationshipEdge,
    RelationshipGraph,
    RelationshipNode,
    RelationshipSignal,
    ReasoningResult,
    ScoreResult,
)


class FileCaseRepository:
    def __init__(self, file_path: str | Path) -> None:
        self._file_path = Path(file_path)
        self._file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._file_path.exists():
            self._file_path.write_text("[]", encoding="utf-8")

    def save(self, case: Case) -> Case:
        rows = self._load()
        serialized = self._serialize(case)
        for index, row in enumerate(rows):
            if row["case_id"] == case.case_id:
                rows[index] = serialized
                self._save(rows)
                return case
        rows.append(serialized)
        self._save(rows)
        return case

    def get_by_id(self, case_id: str) -> Case | None:
        for row in self._load():
            if row["case_id"] == case_id:
                return self._deserialize(row)
        return None

    def list_all(self) -> list[Case]:
        return [self._deserialize(row) for row in self._load()]

    def count_by_user_and_day(self, user_id: str, day_iso: str) -> int:
        return sum(
            1
            for row in self._load()
            if row.get("requested_by") == user_id and str(row.get("created_at", "")).startswith(day_iso)
        )

    def _load(self) -> list[dict]:
        raw = self._file_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        return json.loads(raw)

    def _save(self, rows: list[dict]) -> None:
        self._file_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    def _serialize(self, case: Case) -> dict:
        return {
            "case_id": case.case_id,
            "created_at": case.created_at.isoformat(),
            "updated_at": case.updated_at.isoformat(),
            "requested_by": case.requested_by,
            "source_channel": case.source_channel,
            "processing_state": case.processing_state.value,
            "validation_results": case.validation_results,
            "subject": {
                "person_id": case.subject.person_id,
                "full_name": case.subject.full_name,
                "document_type": case.subject.document_type.value,
                "document_number": case.subject.document_number,
                "birth_date": case.subject.birth_date,
                "age": case.subject.age,
                "email": case.subject.email,
                "phone": case.subject.phone,
                "address": case.subject.address,
                "locality": case.subject.locality,
                "province": case.subject.province,
                "metadata": case.subject.metadata,
            },
            "identity_status": {
                "status": case.identity_status.status.value,
                "verified": case.identity_status.verified,
                "deceased": case.identity_status.deceased,
                "source_reference": case.identity_status.source_reference,
                "source_timestamp": case.identity_status.source_timestamp.isoformat()
                if case.identity_status.source_timestamp
                else None,
                "inconsistencies": case.identity_status.inconsistencies,
                "quality_score": case.identity_status.quality_score,
            },
            "financial_info": None
            if case.financial_info is None
            else {
                "credit_score": case.financial_info.credit_score,
                "debt_ratio": case.financial_info.debt_ratio,
                "bancarization_level": case.financial_info.bancarization_level,
                "active_loans": case.financial_info.active_loans,
                "bounced_checks": case.financial_info.bounced_checks,
                "monthly_income_estimate": case.financial_info.monthly_income_estimate,
                "observation": case.financial_info.observation,
                "source_reference": case.financial_info.source_reference,
                "quality_score": case.financial_info.quality_score,
                "attributes": case.financial_info.attributes,
            },
            "labor_fiscal_info": None
            if case.labor_fiscal_info is None
            else {
                "tax_status": case.labor_fiscal_info.tax_status,
                "main_activity": case.labor_fiscal_info.main_activity,
                "employer_or_company": case.labor_fiscal_info.employer_or_company,
                "income_bracket": case.labor_fiscal_info.income_bracket,
                "registered_employees": case.labor_fiscal_info.registered_employees,
                "fiscal_observation": case.labor_fiscal_info.fiscal_observation,
                "source_reference": case.labor_fiscal_info.source_reference,
                "quality_score": case.labor_fiscal_info.quality_score,
                "attributes": case.labor_fiscal_info.attributes,
            },
            "evidences": [
                {
                    "evidence_id": evidence.evidence_id,
                    "source_type": evidence.source_type.value,
                    "provider_code": evidence.provider_code,
                    "title": evidence.title,
                    "summary": evidence.summary,
                    "details": evidence.details,
                    "collected_at": evidence.collected_at.isoformat(),
                    "quality": evidence.quality.value,
                    "quality_score": evidence.quality_score,
                    "related_keys": evidence.related_keys,
                    "attributes": evidence.attributes,
                    "raw_reference_id": evidence.raw_reference_id,
                }
                for evidence in case.evidences
            ],
            "alerts": [
                {
                    "alert_id": alert.alert_id,
                    "severity": alert.severity.value,
                    "title": alert.title,
                    "short_description": alert.short_description,
                    "detail": alert.detail,
                    "source_type": alert.source_type.value,
                    "source_reference": alert.source_reference,
                    "related_variable": alert.related_variable,
                    "recommendation_hint": alert.recommendation_hint,
                    "evidence_ids": alert.evidence_ids,
                }
                for alert in case.alerts
            ],
            "reasoning_result": None
            if case.reasoning_result is None
            else {
                "reasoning_id": case.reasoning_result.reasoning_id,
                "engine_version": case.reasoning_result.engine_version,
                "summary": case.reasoning_result.summary,
                "hypothesis": case.reasoning_result.hypothesis,
                "evidence_for_review": case.reasoning_result.evidence_for_review,
                "evidence_against_fraud": case.reasoning_result.evidence_against_fraud,
                "inconsistencies": case.reasoning_result.inconsistencies,
                "missing_evidence": case.reasoning_result.missing_evidence,
                "suggested_priority": case.reasoning_result.suggested_priority,
                "suggested_next_checks": case.reasoning_result.suggested_next_checks,
                "supporting_evidence_ids": case.reasoning_result.supporting_evidence_ids,
                "contradictory_evidence_ids": case.reasoning_result.contradictory_evidence_ids,
                "unresolved_questions": case.reasoning_result.unresolved_questions,
                "confidence": case.reasoning_result.confidence,
                "generated_at": case.reasoning_result.generated_at.isoformat(),
                "metadata": case.reasoning_result.metadata,
            },
            "score_result": None
            if case.score_result is None
            else {
                "score_id": case.score_result.score_id,
                "model_name": case.score_result.model_name,
                "model_version": case.score_result.model_version,
                "score_value": case.score_result.score_value,
                "risk_category": case.score_result.risk_category.value,
                "confidence": case.score_result.confidence,
                "top_factors": case.score_result.top_factors,
                "feature_contributions": case.score_result.feature_contributions,
                "evaluated_at": case.score_result.evaluated_at.isoformat(),
                "metadata": case.score_result.metadata,
            },
            "final_assessment": None
            if case.final_assessment is None
            else {
                "assessment_id": case.final_assessment.assessment_id,
                "case_id": case.final_assessment.case_id,
                "risk_category": case.final_assessment.risk_category.value,
                "recommendation": case.final_assessment.recommendation.value,
                "executive_summary": case.final_assessment.executive_summary,
                "final_status": case.final_assessment.final_status,
                "final_priority": case.final_assessment.final_priority,
                "recommended_action": case.final_assessment.recommended_action.value,
                "confidence": case.final_assessment.confidence,
                "summary_for_analyst": case.final_assessment.summary_for_analyst,
                "evidence_quality": case.final_assessment.evidence_quality,
                "pipeline_state": case.final_assessment.pipeline_state,
                "requires_manual_review": case.final_assessment.requires_manual_review,
                "blocked_by_hard_rules": case.final_assessment.blocked_by_hard_rules,
                "hard_rule_reasons": case.final_assessment.hard_rule_reasons,
                "alert_ids": case.final_assessment.alert_ids,
                "reasoning_result_id": case.final_assessment.reasoning_result_id,
                "score_result_id": case.final_assessment.score_result_id,
                "metadata": case.final_assessment.metadata,
                "created_at": case.final_assessment.created_at.isoformat(),
            },
            "consolidated_evidence": None
            if case.consolidated_evidence is None
            else {
                "bundle_id": case.consolidated_evidence.bundle_id,
                "collected_at": case.consolidated_evidence.collected_at.isoformat(),
                "ready_for_rules": case.consolidated_evidence.ready_for_rules,
                "provider_statuses": case.consolidated_evidence.provider_statuses,
                "warnings": case.consolidated_evidence.warnings,
                "evidence_ids": case.consolidated_evidence.evidence_ids,
                "metadata": case.consolidated_evidence.metadata,
            },
            "hard_rule_evaluation": None
            if case.hard_rule_evaluation is None
            else {
                "evaluation_id": case.hard_rule_evaluation.evaluation_id,
                "evaluated_at": case.hard_rule_evaluation.evaluated_at.isoformat(),
                "findings": [
                    {
                        "code": item.code,
                        "severity": item.severity,
                        "message": item.message,
                        "justification": item.justification,
                        "evidence_refs": item.evidence_refs,
                        "effect_on_pipeline": item.effect_on_pipeline,
                        "metadata": item.metadata,
                    }
                    for item in case.hard_rule_evaluation.findings
                ],
                "final_effect": case.hard_rule_evaluation.final_effect,
                "ready_for_reasoning": case.hard_rule_evaluation.ready_for_reasoning,
                "ready_for_scoring": case.hard_rule_evaluation.ready_for_scoring,
                "metadata": case.hard_rule_evaluation.metadata,
            },
            "relationship_graph": None
            if case.relationship_graph is None
            else {
                "graph_id": case.relationship_graph.graph_id,
                "generated_at": case.relationship_graph.generated_at.isoformat(),
                "nodes": [
                    {
                        "node_id": item.node_id,
                        "label": item.label,
                        "node_type": item.node_type,
                        "risk_level": item.risk_level,
                        "metadata": item.metadata,
                    }
                    for item in case.relationship_graph.nodes
                ],
                "edges": [
                    {
                        "edge_id": item.edge_id,
                        "source": item.source,
                        "target": item.target,
                        "relationship_type": item.relationship_type,
                        "severity": item.severity,
                        "metadata": item.metadata,
                    }
                    for item in case.relationship_graph.edges
                ],
                "signals": [
                    {
                        "code": item.code,
                        "severity": item.severity,
                        "message": item.message,
                        "related_case_ids": item.related_case_ids,
                        "metadata": item.metadata,
                    }
                    for item in case.relationship_graph.signals
                ],
                "metadata": case.relationship_graph.metadata,
            },
            "latest_decision": None
            if case.latest_decision is None
            else {
                "decision_id": case.latest_decision.decision_id,
                "case_id": case.latest_decision.case_id,
                "status": case.latest_decision.status.value,
                "actor_id": case.latest_decision.actor_id,
                "actor_name": case.latest_decision.actor_name,
                "actor_role": case.latest_decision.actor_role,
                "comment": case.latest_decision.comment,
                "rationale": case.latest_decision.rationale,
                "created_at": case.latest_decision.created_at.isoformat(),
                "supersedes_decision_id": case.latest_decision.supersedes_decision_id,
            },
            "decision_history": [
                {
                    "decision_id": decision.decision_id,
                    "case_id": decision.case_id,
                    "status": decision.status.value,
                    "actor_id": decision.actor_id,
                    "actor_name": decision.actor_name,
                    "actor_role": decision.actor_role,
                    "comment": decision.comment,
                    "rationale": decision.rationale,
                    "created_at": decision.created_at.isoformat(),
                    "supersedes_decision_id": decision.supersedes_decision_id,
                }
                for decision in case.decision_history
            ],
            "tags": case.tags,
            "metadata": case.metadata,
        }

    def _deserialize(self, row: dict) -> Case:
        person = Person(
            person_id=row["subject"]["person_id"],
            full_name=row["subject"]["full_name"],
            document_type=DocumentType(row["subject"]["document_type"]),
            document_number=row["subject"]["document_number"],
            birth_date=row["subject"].get("birth_date"),
            age=row["subject"].get("age"),
            email=row["subject"].get("email"),
            phone=row["subject"].get("phone"),
            address=row["subject"].get("address"),
            locality=row["subject"].get("locality"),
            province=row["subject"].get("province"),
            metadata=row["subject"].get("metadata", {}),
        )
        identity_status = IdentityStatus(
            status=IdentityLifecycleStatus(row["identity_status"]["status"]),
            verified=row["identity_status"]["verified"],
            deceased=row["identity_status"]["deceased"],
            source_reference=row["identity_status"].get("source_reference"),
            source_timestamp=datetime.fromisoformat(row["identity_status"]["source_timestamp"])
            if row["identity_status"].get("source_timestamp")
            else None,
            inconsistencies=row["identity_status"].get("inconsistencies", []),
            quality_score=row["identity_status"].get("quality_score"),
        )
        financial_info = self._deserialize_financial_info(row.get("financial_info"))
        labor_fiscal_info = self._deserialize_labor_fiscal_info(row.get("labor_fiscal_info"))
        evidences = [self._deserialize_evidence(item) for item in row.get("evidences", [])]
        alerts = [self._deserialize_alert(item) for item in row.get("alerts", [])]
        reasoning_result = self._deserialize_reasoning(row.get("reasoning_result"))
        score_result = self._deserialize_score(row.get("score_result"))
        final_assessment = self._deserialize_assessment(row.get("final_assessment"))
        consolidated_evidence = self._deserialize_consolidated_evidence(row.get("consolidated_evidence"))
        hard_rule_evaluation = self._deserialize_hard_rule_evaluation(row.get("hard_rule_evaluation"))
        relationship_graph = self._deserialize_relationship_graph(row.get("relationship_graph"))
        latest_decision = self._deserialize_decision(row.get("latest_decision"))
        decision_history = [self._deserialize_decision(item) for item in row.get("decision_history", [])]
        if latest_decision is not None and not decision_history:
            decision_history = [latest_decision]

        return Case(
            case_id=row["case_id"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
            requested_by=row.get("requested_by"),
            source_channel=row["source_channel"],
            processing_state=CaseProcessingState(row["processing_state"]),
            validation_results=row.get("validation_results", {}),
            subject=person,
            identity_status=identity_status,
            financial_info=financial_info,
            labor_fiscal_info=labor_fiscal_info,
            evidences=evidences,
            alerts=alerts,
            reasoning_result=reasoning_result,
            score_result=score_result,
            final_assessment=final_assessment,
            consolidated_evidence=consolidated_evidence,
            hard_rule_evaluation=hard_rule_evaluation,
            relationship_graph=relationship_graph,
            latest_decision=latest_decision,
            decision_history=decision_history,
            tags=row.get("tags", []),
            metadata=row.get("metadata", {}),
        )

    def _deserialize_financial_info(self, row: dict | None) -> FinancialInfo | None:
        if row is None:
            return None
        return FinancialInfo(
            credit_score=row.get("credit_score"),
            debt_ratio=row.get("debt_ratio"),
            bancarization_level=row.get("bancarization_level"),
            active_loans=row.get("active_loans"),
            bounced_checks=row.get("bounced_checks"),
            monthly_income_estimate=row.get("monthly_income_estimate"),
            observation=row.get("observation"),
            source_reference=row.get("source_reference"),
            quality_score=row.get("quality_score"),
            attributes=row.get("attributes", {}),
        )

    def _deserialize_labor_fiscal_info(self, row: dict | None) -> LaborFiscalInfo | None:
        if row is None:
            return None
        return LaborFiscalInfo(
            tax_status=row.get("tax_status"),
            main_activity=row.get("main_activity"),
            employer_or_company=row.get("employer_or_company"),
            income_bracket=row.get("income_bracket"),
            registered_employees=row.get("registered_employees"),
            fiscal_observation=row.get("fiscal_observation"),
            source_reference=row.get("source_reference"),
            quality_score=row.get("quality_score"),
            attributes=row.get("attributes", {}),
        )

    def _deserialize_evidence(self, row: dict) -> Evidence:
        return Evidence(
            evidence_id=row["evidence_id"],
            source_type=EvidenceSourceType(row["source_type"]),
            provider_code=row["provider_code"],
            title=row["title"],
            summary=row["summary"],
            details=row["details"],
            collected_at=datetime.fromisoformat(row["collected_at"]),
            quality=EvidenceQuality(row.get("quality", "UNKNOWN")),
            quality_score=row.get("quality_score"),
            related_keys=row.get("related_keys", []),
            attributes=row.get("attributes", {}),
            raw_reference_id=row.get("raw_reference_id"),
        )

    def _deserialize_alert(self, row: dict) -> Alert:
        return Alert(
            alert_id=row["alert_id"],
            severity=AlertSeverity(row["severity"]),
            title=row["title"],
            short_description=row["short_description"],
            detail=row["detail"],
            source_type=EvidenceSourceType(row["source_type"]),
            source_reference=row.get("source_reference"),
            related_variable=row.get("related_variable"),
            recommendation_hint=row.get("recommendation_hint"),
            evidence_ids=row.get("evidence_ids", []),
        )

    def _deserialize_reasoning(self, row: dict | None) -> ReasoningResult | None:
        if row is None:
            return None
        return ReasoningResult(
            reasoning_id=row["reasoning_id"],
            engine_version=row["engine_version"],
            summary=row["summary"],
            hypothesis=row["hypothesis"],
            evidence_for_review=row.get("evidence_for_review", []),
            evidence_against_fraud=row.get("evidence_against_fraud", []),
            inconsistencies=row.get("inconsistencies", []),
            missing_evidence=row.get("missing_evidence", []),
            suggested_priority=row.get("suggested_priority", "MEDIUM"),
            suggested_next_checks=row.get("suggested_next_checks", []),
            supporting_evidence_ids=row.get("supporting_evidence_ids", []),
            contradictory_evidence_ids=row.get("contradictory_evidence_ids", []),
            unresolved_questions=row.get("unresolved_questions", []),
            confidence=row.get("confidence"),
            generated_at=datetime.fromisoformat(row["generated_at"]),
            metadata=row.get("metadata", {}),
        )

    def _deserialize_score(self, row: dict | None) -> ScoreResult | None:
        if row is None:
            return None
        return ScoreResult(
            score_id=row["score_id"],
            model_name=row["model_name"],
            model_version=row["model_version"],
            score_value=row["score_value"],
            risk_category=RiskCategory(row["risk_category"]),
            confidence=row.get("confidence"),
            top_factors=row.get("top_factors", []),
            feature_contributions=row.get("feature_contributions", {}),
            evaluated_at=datetime.fromisoformat(row["evaluated_at"]),
            metadata=row.get("metadata", {}),
        )

    def _deserialize_assessment(self, row: dict | None) -> FinalAssessment | None:
        if row is None:
            return None
        return FinalAssessment(
            assessment_id=row["assessment_id"],
            case_id=row["case_id"],
            risk_category=RiskCategory(row["risk_category"]),
            recommendation=RecommendationType(row["recommendation"]),
            executive_summary=row["executive_summary"],
            final_status=row.get("final_status", row["risk_category"]),
            final_priority=row.get("final_priority", "MEDIUM"),
            recommended_action=RecommendationType(row.get("recommended_action", row["recommendation"])),
            confidence=row.get("confidence"),
            summary_for_analyst=row.get("summary_for_analyst", row["executive_summary"]),
            evidence_quality=row.get("evidence_quality"),
            pipeline_state=row.get("pipeline_state"),
            requires_manual_review=row["requires_manual_review"],
            blocked_by_hard_rules=row["blocked_by_hard_rules"],
            hard_rule_reasons=row.get("hard_rule_reasons", []),
            alert_ids=row.get("alert_ids", []),
            reasoning_result_id=row.get("reasoning_result_id"),
            score_result_id=row.get("score_result_id"),
            metadata=row.get("metadata", {}),
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    def _deserialize_decision(self, row: dict | None) -> Decision | None:
        if row is None:
            return None
        return Decision(
            decision_id=row["decision_id"],
            case_id=row["case_id"],
            status=DecisionStatus(row["status"]),
            actor_id=row.get("actor_id"),
            actor_name=row.get("actor_name"),
            actor_role=row.get("actor_role"),
            comment=row.get("comment"),
            rationale=row.get("rationale"),
            created_at=datetime.fromisoformat(row["created_at"]),
            supersedes_decision_id=row.get("supersedes_decision_id"),
        )

    def _deserialize_consolidated_evidence(self, row: dict | None) -> ConsolidatedEvidence | None:
        if row is None:
            return None
        return ConsolidatedEvidence(
            bundle_id=row["bundle_id"],
            collected_at=datetime.fromisoformat(row["collected_at"]),
            ready_for_rules=row["ready_for_rules"],
            provider_statuses=row.get("provider_statuses", {}),
            warnings=row.get("warnings", []),
            evidence_ids=row.get("evidence_ids", []),
            metadata=row.get("metadata", {}),
        )

    def _deserialize_hard_rule_evaluation(self, row: dict | None) -> HardRuleEvaluation | None:
        if row is None:
            return None
        return HardRuleEvaluation(
            evaluation_id=row["evaluation_id"],
            evaluated_at=datetime.fromisoformat(row["evaluated_at"]),
            findings=[
                HardRuleFinding(
                    code=item["code"],
                    severity=item["severity"],
                    message=item["message"],
                    justification=item["justification"],
                    evidence_refs=item.get("evidence_refs", []),
                    effect_on_pipeline=item.get("effect_on_pipeline", ""),
                    metadata=item.get("metadata", {}),
                )
                for item in row.get("findings", [])
            ],
            final_effect=row.get("final_effect", ""),
            ready_for_reasoning=row.get("ready_for_reasoning", False),
            ready_for_scoring=row.get("ready_for_scoring", False),
            metadata=row.get("metadata", {}),
        )

    def _deserialize_relationship_graph(self, row: dict | None) -> RelationshipGraph | None:
        if row is None:
            return None
        return RelationshipGraph(
            graph_id=row["graph_id"],
            generated_at=datetime.fromisoformat(row["generated_at"]),
            nodes=[
                RelationshipNode(
                    node_id=item["node_id"],
                    label=item["label"],
                    node_type=item["node_type"],
                    risk_level=item["risk_level"],
                    metadata=item.get("metadata", {}),
                )
                for item in row.get("nodes", [])
            ],
            edges=[
                RelationshipEdge(
                    edge_id=item["edge_id"],
                    source=item["source"],
                    target=item["target"],
                    relationship_type=item["relationship_type"],
                    severity=item["severity"],
                    metadata=item.get("metadata", {}),
                )
                for item in row.get("edges", [])
            ],
            signals=[
                RelationshipSignal(
                    code=item["code"],
                    severity=item["severity"],
                    message=item["message"],
                    related_case_ids=item.get("related_case_ids", []),
                    metadata=item.get("metadata", {}),
                )
                for item in row.get("signals", [])
            ],
            metadata=row.get("metadata", {}),
        )
