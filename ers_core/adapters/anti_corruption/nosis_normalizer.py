from __future__ import annotations

from ers_core.adapters.anti_corruption.external_to_domain import (
    ExternalNormalizationResult,
    MappingContext,
)
from ers_core.application.ports.provider_ports import ProviderPayload
from ers_core.domain.enums import AlertSeverity, EvidenceQuality, EvidenceSourceType
from ers_core.domain.models import Alert, Evidence, FinancialInfo, LaborFiscalInfo


class NosisPayloadNormalizer:
    def normalize(self, payload: ProviderPayload, context: MappingContext) -> ExternalNormalizationResult:
        financial = payload.data.get("financiero", {})
        labor = payload.data.get("laboralFiscal", {})
        trace = payload.data.get("trazabilidad", {})
        partial = bool(payload.metadata.get("partial", False))

        warnings: list[str] = []
        alerts: list[Alert] = []
        if partial:
            warnings.append("El proveedor financiero devolvio una respuesta parcial.")
            alerts.append(
                Alert(
                    alert_id=f"ALT-FIN-PARTIAL-{context.metadata.get('caseId')}",
                    severity=AlertSeverity.INFO,
                    title="Respuesta parcial del proveedor financiero",
                    short_description="Se consolidaron datos parciales de Nosis.",
                    detail="Faltan algunos campos laborales/fiscales, pero la evidencia estructurada fue persistida.",
                    source_type=EvidenceSourceType.FINANCIAL,
                    source_reference=payload.provider_code,
                    related_variable="provider_partial_response",
                    recommendation_hint="Completar enrichment antes de aplicar reglas duras sensibles.",
                    evidence_ids=[f"EVD-FIN-{context.metadata.get('caseId')}"],
                )
            )

        evidences = [
            Evidence(
                evidence_id=f"EVD-FIN-{context.metadata.get('caseId')}",
                source_type=EvidenceSourceType.FINANCIAL,
                provider_code=context.provider_code,
                title="Perfil financiero normalizado",
                summary="Se consolido el perfil financiero desde el segundo proveedor.",
                details=(
                    f"Credit score {financial.get('creditScore')}, deuda {financial.get('debtRatio')}, "
                    f"cheques rechazados {financial.get('bouncedChecks')}."
                ),
                collected_at=context.collected_at,
                quality=EvidenceQuality.MEDIUM if partial else EvidenceQuality.HIGH,
                quality_score=0.72 if partial else 0.9,
                related_keys=["credit_score", "debt_ratio", "bounced_checks"],
                attributes={"consultaId": trace.get("consultaId"), "partial": partial},
                raw_reference_id=payload.metadata.get("integrationId"),
            ),
            Evidence(
                evidence_id=f"EVD-LAB-{context.metadata.get('caseId')}",
                source_type=EvidenceSourceType.LABOR_FISCAL,
                provider_code=context.provider_code,
                title="Perfil laboral y fiscal normalizado",
                summary="Se consolido condicion fiscal y actividad economica.",
                details=(
                    f"Condicion {labor.get('taxStatus')}, actividad {labor.get('mainActivity')}, "
                    f"empleados registrados {labor.get('registeredEmployees')}."
                ),
                collected_at=context.collected_at,
                quality=EvidenceQuality.MEDIUM if partial else EvidenceQuality.HIGH,
                quality_score=0.68 if partial else 0.84,
                related_keys=["tax_status", "main_activity", "income_bracket"],
                attributes={"consultaId": trace.get("consultaId"), "partial": partial},
                raw_reference_id=payload.metadata.get("integrationId"),
            ),
        ]

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
            labor_fiscal_info=LaborFiscalInfo(
                tax_status=labor.get("taxStatus"),
                main_activity=labor.get("mainActivity"),
                employer_or_company=labor.get("employerOrCompany"),
                income_bracket=labor.get("incomeBracket"),
                registered_employees=labor.get("registeredEmployees"),
                fiscal_observation=labor.get("fiscalObservation"),
                source_reference=payload.provider_code,
                quality_score=0.68 if partial else 0.84,
                attributes={
                    "partial": partial,
                    "consultaId": trace.get("consultaId"),
                    "declaredProvince": labor.get("declaredProvince"),
                },
            ),
            evidences=evidences,
            alerts=alerts,
            quality_warnings=warnings,
        )
