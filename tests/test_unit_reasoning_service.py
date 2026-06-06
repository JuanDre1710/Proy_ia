from __future__ import annotations

from datetime import datetime
import unittest

from ers_core.application.services.reasoning_service import ReasoningService
from ers_core.domain.enums import (
    AlertSeverity,
    CaseProcessingState,
    DocumentType,
    EvidenceQuality,
    EvidenceSourceType,
    IdentityLifecycleStatus,
)
from ers_core.domain.models import (
    Alert,
    Case,
    ConsolidatedEvidence,
    Evidence,
    FinancialInfo,
    HardRuleEvaluation,
    HardRuleFinding,
    IdentityStatus,
    LaborFiscalInfo,
    Person,
)


class ReasoningServiceTests(unittest.TestCase):
    def test_reason_builds_demo_structured_output(self) -> None:
        now = datetime.utcnow()
        case = Case(
            case_id="30111201",
            created_at=now,
            updated_at=now,
            requested_by="usr-test",
            source_channel="unit",
            processing_state=CaseProcessingState.READY_FOR_REASONING,
            validation_results={},
            subject=Person(
                person_id="30111201",
                full_name="Caso Demo",
                document_type=DocumentType.CUIL,
                document_number="30111201",
                province="Buenos Aires",
            ),
            identity_status=IdentityStatus(
                status=IdentityLifecycleStatus.VERIFIED,
                verified=True,
                deceased=False,
                inconsistencies=["domicilio observado"],
                quality_score=0.97,
            ),
            financial_info=FinancialInfo(
                credit_score=520,
                debt_ratio=0.52,
                bounced_checks=1,
                attributes={"partial": True},
            ),
            labor_fiscal_info=LaborFiscalInfo(
                tax_status="Monotributo",
                main_activity="Servicios",
                registered_employees=None,
            ),
            evidences=[
                Evidence(
                    evidence_id="EVD-FIN-1",
                    source_type=EvidenceSourceType.FINANCIAL,
                    provider_code="DEMO_FINANCIAL",
                    title="Perfil financiero normalizado",
                    summary="Se consolido el perfil financiero desde provider demo interno.",
                    details="detalle",
                    collected_at=now,
                    quality=EvidenceQuality.HIGH,
                    quality_score=0.9,
                )
            ],
            alerts=[
                Alert(
                    alert_id="ALT-1",
                    severity=AlertSeverity.WARNING,
                    title="Proveedor observado",
                    short_description="Financial provider partial response.",
                    detail="detalle",
                    source_type=EvidenceSourceType.FINANCIAL,
                )
            ],
            reasoning_result=None,
            score_result=None,
            final_assessment=None,
            consolidated_evidence=ConsolidatedEvidence(
                bundle_id="EVB-1",
                collected_at=now,
                ready_for_rules=True,
                provider_statuses={"IDENTITY": "ok", "FINANCIAL": "partial", "LABOR_FISCAL": "ok"},
                warnings=["El proveedor financiero demo devolvio una respuesta parcial."],
                evidence_ids=["EVD-FIN-1"],
            ),
            hard_rule_evaluation=HardRuleEvaluation(
                evaluation_id="HRE-1",
                evaluated_at=now,
                findings=[
                    HardRuleFinding(
                        code="INSUFFICIENT_DATA",
                        severity="WARNING",
                        message="El caso no tiene evidencia suficiente para una evaluacion confiable.",
                        justification="faltan bloques",
                    )
                ],
                final_effect="continue_to_reasoning",
                ready_for_reasoning=True,
            ),
            latest_decision=None,
        )

        result = ReasoningService().reason(case)

        self.assertTrue(result.summary)
        self.assertEqual(result.summary, result.metadata["reasoningSummary"])
        self.assertIn("domicilio observado", " ".join(result.inconsistencies))
        self.assertGreaterEqual(len(result.evidence_for_review), 1)
        self.assertGreaterEqual(len(result.missing_evidence), 1)
        self.assertIn(result.suggested_priority, {"LOW", "MEDIUM", "HIGH"})
        self.assertEqual("demo_internal", result.metadata["reasoningMode"])


if __name__ == "__main__":
    unittest.main()
