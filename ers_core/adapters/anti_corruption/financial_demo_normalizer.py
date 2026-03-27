from __future__ import annotations

from ers_core.adapters.anti_corruption.external_to_domain import ExternalNormalizationResult, MappingContext
from ers_core.application.ports.provider_ports import ProviderPayload
from ers_core.domain.enums import AlertSeverity, EvidenceQuality, EvidenceSourceType
from ers_core.domain.models import Alert, Evidence, FinancialInfo


class FinancialDemoPayloadNormalizer:
    def normalize(self, payload: ProviderPayload, context: MappingContext) -> ExternalNormalizationResult:
        financial = payload.data.get("financiero", {})
        trace = payload.data.get("trazabilidad", {})
        partial = bool(payload.metadata.get("partial", False))

        warnings: list[str] = []
        alerts: list[Alert] = []
        if partial:
            warnings.append("El proveedor financiero demo devolvio una respuesta parcial.")
            alerts.append(
                Alert(
                    alert_id=f"ALT-FIN-PARTIAL-{context.metadata.get('caseId')}",
                    severity=AlertSeverity.INFO,
                    title="Respuesta parcial del proveedor financiero demo",
                    short_description="Se consolidaron datos parciales financieros.",
                    detail="Faltan algunas variables financieras, pero el enrichment continuo con evidencia estructurada.",
                    source_type=EvidenceSourceType.FINANCIAL,
                    source_reference=payload.provider_code,
                    related_variable="provider_partial_response",
                    recommendation_hint="Continuar con evidencia disponible y revisar contexto.",
                    evidence_ids=[f"EVD-FIN-{context.metadata.get('caseId')}"],
                )
            )

        evidence = Evidence(
            evidence_id=f"EVD-FIN-{context.metadata.get('caseId')}",
            source_type=EvidenceSourceType.FINANCIAL,
            provider_code=context.provider_code,
            title="Perfil financiero normalizado",
            summary="Se consolido el perfil financiero desde provider demo interno.",
            details=f"Credit score {financial.get('creditScore')}, deuda {financial.get('debtRatio')}, cheques rechazados {financial.get('bouncedChecks')}.",
            collected_at=context.collected_at,
            quality=EvidenceQuality.MEDIUM if partial else EvidenceQuality.HIGH,
            quality_score=0.72 if partial else 0.9,
            related_keys=["credit_score", "debt_ratio", "bounced_checks"],
            attributes={"consultaId": trace.get("consultaId"), "partial": partial},
            raw_reference_id=payload.metadata.get("integrationId"),
        )

        return ExternalNormalizationResult(
            financial_info=FinancialInfo(
                credit_score=financial.get("creditScore"),
                debt_ratio=financial.get("debtRatio"),
                bancarization_level=financial.get("bancarizationLevel"),
                active_loans=financial.get("activeLoans"),
                bounced_checks=financial.get("bouncedChecks"),
                monthly_income_estimate=financial.get("monthlyIncomeEstimate"),
                observation=financial.get("observation"),
                source_reference=payload.provider_code,
                quality_score=0.72 if partial else 0.9,
                attributes={"partial": partial, "consultaId": trace.get("consultaId")},
            ),
            evidences=[evidence],
            alerts=alerts,
            quality_warnings=warnings,
        )
