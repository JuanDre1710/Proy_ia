from __future__ import annotations

from datetime import datetime

from ers_core.adapters.providers.demo_provider_base import DemoProviderAdapter
from ers_core.adapters.providers.errors import (
    ProviderDisabledError,
    ProviderInsufficientDataError,
    ProviderTechnicalError,
    ProviderTimeoutError,
)
from ers_core.application.ports.provider_ports import ProviderPayload, ProviderRequest
from ers_core.domain.models import IntegrationConfig


class FinancialDemoProvider(DemoProviderAdapter):
    def fetch_financial_profile(self, request: ProviderRequest, config: IntegrationConfig) -> ProviderPayload:
        if not config.enabled:
            raise ProviderDisabledError()

        mode = self._resolve_mode(request.subject_identifier, config)
        if mode == "timeout":
            raise ProviderTimeoutError("Financial demo provider timed out.")
        if mode == "technical_error":
            raise ProviderTechnicalError("Financial demo provider returned internal error.")
        if mode == "insufficient":
            raise ProviderInsufficientDataError("Financial demo provider returned insufficient variables.")

        digits = [int(char) for char in request.subject_identifier if char.isdigit()]
        seed = sum((index + 2) * value for index, value in enumerate(digits)) or 29
        partial = mode == "partial"

        credit_score = 430 + seed % 360
        debt_ratio = round(min(0.15 + (seed % 55) / 100, 0.87), 2)
        bounced_checks = seed % 4
        active_loans = seed % 5

        return ProviderPayload(
            provider_code=config.provider_code,
            received_at=datetime.utcnow().isoformat(),
            data={
                "financiero": {
                    "creditScore": credit_score,
                    "debtRatio": debt_ratio,
                    "bancarizationLevel": "Alta" if seed % 3 == 0 else "Media" if seed % 3 == 1 else "Baja",
                    "activeLoans": active_loans,
                    "bouncedChecks": bounced_checks,
                    "monthlyIncomeEstimate": f"ARS {250000 + (seed % 7) * 90000}",
                    "observation": "Respuesta parcial del proveedor financiero demo." if partial else "Perfil financiero consolidado desde provider demo.",
                },
                "trazabilidad": {
                    "consultaId": f"FIN-DEMO-{request.subject_identifier}",
                    "partial": partial,
                },
            },
            metadata={
                "integrationId": config.integration_id,
                "providerType": config.provider_type.value,
                "providerMode": "demo_internal",
                "status": "partial" if partial else "ok",
                "partial": partial,
            },
        )

    def _resolve_mode(self, identifier: str, config: IntegrationConfig) -> str:
        forced = str(config.settings.get("stubMode", "success")).lower()
        if forced != "success":
            return forced
        if identifier.endswith("97"):
            return "timeout"
        if identifier.endswith("98"):
            return "technical_error"
        if identifier.endswith("99"):
            return "insufficient"
        if identifier.endswith("88"):
            return "partial"
        return "success"
