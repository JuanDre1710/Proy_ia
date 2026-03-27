from __future__ import annotations

from ers_core.adapters.anti_corruption.external_to_domain import ExternalNormalizationResult, MappingContext
from ers_core.application.ports.provider_ports import ProviderPayload
from ers_core.domain.enums import AlertSeverity, EvidenceQuality, EvidenceSourceType
from ers_core.domain.models import Alert, Evidence, LaborFiscalInfo


class LaborDemoPayloadNormalizer:
    def normalize(self, payload: ProviderPayload, context: MappingContext) -> ExternalNormalizationResult:
        labor = payload.data.get("laboralFiscal", {})
        trace = payload.data.get("trazabilidad", {})
        partial = bool(payload.metadata.get("partial", False))

        warnings: list[str] = []
        alerts: list[Alert] = []
        if partial:
            warnings.append("El proveedor laboral/fiscal demo devolvio una respuesta parcial.")
            alerts.append(
                Alert(
                    alert_id=f"ALT-LAB-PARTIAL-{context.metadata.get('caseId')}",
                    severity=AlertSeverity.INFO,
                    title="Respuesta parcial del proveedor laboral/fiscal demo",
                    short_description="Se consolidaron datos parciales laborales y fiscales.",
                    detail="Faltan algunos campos laborales/fiscales, pero la evidencia estructurada fue persistida.",
                    source_type=EvidenceSourceType.LABOR_FISCAL,
                    source_reference=payload.provider_code,
                    related_variable="provider_partial_response",
                    recommendation_hint="Usar esta evidencia solo como apoyo contextual en la demo.",
                    evidence_ids=[f"EVD-LAB-{context.metadata.get('caseId')}"],
                )
            )

        evidence = Evidence(
            evidence_id=f"EVD-LAB-{context.metadata.get('caseId')}",
            source_type=EvidenceSourceType.LABOR_FISCAL,
            provider_code=context.provider_code,
            title="Perfil laboral y fiscal normalizado",
            summary="Se consolido condicion fiscal y actividad economica desde provider demo interno.",
            details=f"Condicion {labor.get('taxStatus')}, actividad {labor.get('mainActivity')}, empleados registrados {labor.get('registeredEmployees')}.",
            collected_at=context.collected_at,
            quality=EvidenceQuality.MEDIUM if partial else EvidenceQuality.HIGH,
            quality_score=0.68 if partial else 0.84,
            related_keys=["tax_status", "main_activity", "income_bracket"],
            attributes={"consultaId": trace.get("consultaId"), "partial": partial},
            raw_reference_id=payload.metadata.get("integrationId"),
        )

        return ExternalNormalizationResult(
            labor_fiscal_info=LaborFiscalInfo(
                tax_status=labor.get("taxStatus"),
                main_activity=labor.get("mainActivity"),
                employer_or_company=labor.get("employerOrCompany"),
                income_bracket=labor.get("incomeBracket"),
                registered_employees=labor.get("registeredEmployees"),
                fiscal_observation=labor.get("fiscalObservation"),
                source_reference=payload.provider_code,
                quality_score=0.68 if partial else 0.84,
                attributes={"partial": partial, "consultaId": trace.get("consultaId"), "declaredProvince": labor.get("declaredProvince")},
            ),
            evidences=[evidence],
            alerts=alerts,
            quality_warnings=warnings,
        )
