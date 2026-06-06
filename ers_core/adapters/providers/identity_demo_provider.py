from __future__ import annotations

from datetime import datetime

from ers_core.adapters.providers.demo_provider_base import DemoProviderAdapter
from ers_core.adapters.providers.errors import ProviderDisabledError, ProviderTimeoutError
from ers_core.application.ports.provider_ports import ProviderPayload, ProviderRequest
from ers_core.domain.models import IntegrationConfig


class IdentityDemoProvider(DemoProviderAdapter):
    def fetch_identity(self, request: ProviderRequest, config: IntegrationConfig) -> ProviderPayload:
        if not config.enabled:
            raise ProviderDisabledError()

        mode = str(config.settings.get("stubMode", "success")).lower()
        if mode == "timeout":
            raise ProviderTimeoutError("Identity demo provider timed out.")

        digits = [int(char) for char in request.subject_identifier if char.isdigit()]
        seed = sum((index + 1) * value for index, value in enumerate(digits)) or 19
        provinces = [
            ("Buenos Aires", "La Plata"),
            ("Cordoba", "Cordoba"),
            ("Santa Fe", "Rosario"),
            ("Mendoza", "Godoy Cruz"),
            ("Neuquen", "Neuquen"),
        ]
        province, locality = provinces[seed % len(provinces)]
        shared_relationship_profile = request.subject_identifier.endswith(("44", "45"))
        if shared_relationship_profile:
            province, locality = "Buenos Aires", "La Plata"
        first_names = ["Ana", "Juan", "Carla", "Diego", "Lucia", "Martin", "Paula"]
        last_names = ["Perez", "Gomez", "Lopez", "Romero", "Diaz", "Sosa", "Fernandez"]

        return ProviderPayload(
            provider_code=config.provider_code,
            received_at=datetime.utcnow().isoformat(),
            data={
                "persona": {
                    "nombreCompleto": f"{first_names[seed % len(first_names)]} {last_names[(seed // 2) % len(last_names)]}",
                    "fechaNacimiento": f"{1974 + seed % 28:04d}-{(seed % 12) + 1:02d}-{(seed % 27) + 1:02d}",
                    "edad": 22 + seed % 45,
                    "email": f"titular{request.subject_identifier[-4:]}@ers.local",
                    "telefono": "+54-11-5555-4444" if shared_relationship_profile else f"+54-11-{1000 + seed % 9000}-{1000 + (seed * 5) % 9000}",
                    "domicilio": "Calle Compartida 100" if shared_relationship_profile else f"Calle Validada {100 + seed % 800}",
                    "localidad": locality,
                    "provincia": province,
                },
                "identidad": {
                    "verificada": seed % 6 != 0,
                    "fallecido": seed % 31 == 0,
                    "inconsistencias": ["domicilio observado"] if seed % 8 == 0 else [],
                    "calidad": 0.97 if seed % 6 != 0 else 0.71,
                    "estado": "VERIFIED" if seed % 6 != 0 else "UNVERIFIED",
                },
            },
            metadata={
                "integrationId": config.integration_id,
                "providerType": config.provider_type.value,
                "providerMode": "demo_internal",
                "status": "ok",
                "partial": False,
            },
        )
