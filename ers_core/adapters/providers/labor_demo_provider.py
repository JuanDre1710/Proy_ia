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


class LaborDemoProvider(DemoProviderAdapter):
    def fetch_labor_fiscal_profile(self, request: ProviderRequest, config: IntegrationConfig) -> ProviderPayload:
        if not config.enabled:
            raise ProviderDisabledError()

        mode = self._resolve_mode(request.subject_identifier, config)
        if mode == "timeout":
            raise ProviderTimeoutError("Labor demo provider timed out.")
        if mode == "technical_error":
            raise ProviderTechnicalError("Labor demo provider returned internal error.")
        if mode == "insufficient":
            raise ProviderInsufficientDataError("Labor demo provider returned insufficient variables.")

        digits = [int(char) for char in request.subject_identifier if char.isdigit()]
        seed = sum((index + 2) * value for index, value in enumerate(digits)) or 29
        identity_seed = sum((index + 1) * value for index, value in enumerate(digits)) or 19
        partial = mode == "partial"
        shared_relationship_profile = request.subject_identifier.endswith(("44", "45"))
        provinces = ["Buenos Aires", "Cordoba", "Santa Fe", "Mendoza", "Neuquen"]
        declared_province = provinces[identity_seed % len(provinces)]
        if shared_relationship_profile:
            declared_province = "Buenos Aires"
        if request.subject_identifier.endswith("77"):
            declared_province = "Tucuman"

        return ProviderPayload(
            provider_code=config.provider_code,
            received_at=datetime.utcnow().isoformat(),
            data={
                "laboralFiscal": {
                    "taxStatus": "Responsable Inscripto" if seed % 2 == 0 else "Monotributo",
                    "mainActivity": "Servicios profesionales" if seed % 2 == 0 else "Comercio",
                    "employerOrCompany": "Empresa Vinculada SA" if shared_relationship_profile else f"Empresa {100 + seed % 900}",
                    "incomeBracket": "Alto" if seed % 4 == 0 else "Medio" if seed % 4 in {1, 2} else "Bajo",
                    "registeredEmployees": None if partial else 2 + seed % 16,
                    "declaredProvince": declared_province,
                    "fiscalObservation": "Registro fiscal incompleto." if partial else "Actividad y condicion fiscal consolidadas desde provider demo.",
                },
                "trazabilidad": {
                    "consultaId": f"LAB-DEMO-{request.subject_identifier}",
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
        if identifier.endswith("87"):
            return "partial"
        if identifier.endswith("96"):
            return "timeout"
        if identifier.endswith("95"):
            return "technical_error"
        if identifier.endswith("94"):
            return "insufficient"
        return "success"
