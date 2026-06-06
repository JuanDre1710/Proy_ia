from __future__ import annotations

import unittest
from datetime import datetime

from ers_core.application.services.final_assessment_builder import FinalAssessmentBuilder
from ers_core.domain.enums import (
    AlertSeverity,
    CaseProcessingState,
    DocumentType,
    EvidenceSourceType,
    IdentityLifecycleStatus,
    RecommendationType,
    RiskCategory,
)
from ers_core.domain.models import (
    Alert,
    Case,
    ConsolidatedEvidence,
    HardRuleEvaluation,
    IdentityStatus,
    Person,
    ReasoningResult,
    ScoreResult,
)


class FinalAssessmentBuilderTests(unittest.TestCase):
    def test_builds_final_assessment_for_scored_case(self) -> None:
        now = datetime.utcnow()
        case = Case(
            case_id="27123456789",
            created_at=now,
            updated_at=now,
            requested_by="usr-eval",
            source_channel="test",
            processing_state=CaseProcessingState.SCORED,
            validation_results={"identifier": "valid"},
            subject=Person(
                person_id="27123456789",
                full_name="Test User",
                document_type=DocumentType.CUIL,
                document_number="27123456789",
            ),
            identity_status=IdentityStatus(
                status=IdentityLifecycleStatus.VERIFIED,
                verified=True,
                deceased=False,
                source_reference="RENAPER",
            ),
            alerts=[
                Alert(
                    alert_id="ALT-1",
                    severity=AlertSeverity.WARNING,
                    title="alert",
                    short_description="desc",
                    detail="detail",
                    source_type=EvidenceSourceType.SYSTEM,
                )
            ],
            reasoning_result=ReasoningResult(
                reasoning_id="REA-1",
                engine_version="1",
                summary="Reasoning summary",
                hypothesis="Hypothesis",
                suggested_priority="HIGH",
                confidence=0.7,
            ),
            score_result=ScoreResult(
                score_id="SCR-1",
                model_name="heuristic",
                model_version="1",
                score_value=82.0,
                risk_category=RiskCategory.FRAUD_SUSPECT,
                confidence=0.74,
            ),
            consolidated_evidence=ConsolidatedEvidence(
                bundle_id="EVB-1",
                collected_at=now,
                ready_for_rules=True,
                provider_statuses={"IDENTITY": "ok", "FINANCIAL": "ok"},
                warnings=[],
            ),
            hard_rule_evaluation=HardRuleEvaluation(
                evaluation_id="HR-1",
                evaluated_at=now,
                final_effect="continue_to_reasoning",
                ready_for_reasoning=True,
                ready_for_scoring=True,
            ),
            tags=[],
            metadata={},
        )

        assessment = FinalAssessmentBuilder().build(case)

        self.assertIsNotNone(assessment)
        self.assertEqual("REVIEW_REQUIRED", assessment.final_status)
        self.assertEqual("HIGH", assessment.final_priority)
        self.assertEqual(RecommendationType.ESCALATE, assessment.recommended_action)
        self.assertEqual(RiskCategory.FRAUD_SUSPECT, assessment.risk_category)
        self.assertTrue(assessment.requires_manual_review)


if __name__ == "__main__":
    unittest.main()
