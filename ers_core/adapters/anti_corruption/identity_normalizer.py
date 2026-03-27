from __future__ import annotations

from ers_core.adapters.anti_corruption.external_to_domain import (
    ExternalNormalizationResult,
    MappingContext,
)
from ers_core.application.ports.provider_ports import ProviderPayload
from ers_core.domain.enums import EvidenceQuality, EvidenceSourceType, IdentityLifecycleStatus
from ers_core.domain.models import Evidence, IdentityStatus, Person


class IdentityPayloadNormalizer:
    def normalize(self, payload: ProviderPayload, context: MappingContext) -> ExternalNormalizationResult:
        person_data = payload.data.get("persona", {})
        identity_data = payload.data.get("identidad", {})

        evidence = Evidence(
            evidence_id=f"EVD-ID-{context.metadata.get('caseId')}",
            source_type=EvidenceSourceType.IDENTITY,
            provider_code=context.provider_code,
            title="Identidad normalizada",
            summary="Se consolidaron datos de identidad y contacto.",
            details=f"Estado {identity_data.get('estado', 'UNVERIFIED')}.",
            collected_at=context.collected_at,
            quality=EvidenceQuality.HIGH if identity_data.get("verificada") else EvidenceQuality.MEDIUM,
            quality_score=identity_data.get("calidad"),
            related_keys=["identity", "contact", "subject"],
            attributes={"partial": payload.metadata.get("partial", False)},
            raw_reference_id=payload.metadata.get("integrationId"),
        )

        return ExternalNormalizationResult(
            identity_status=IdentityStatus(
                status=IdentityLifecycleStatus(identity_data.get("estado", "UNVERIFIED")),
                verified=bool(identity_data.get("verificada", False)),
                deceased=bool(identity_data.get("fallecido", False)),
                source_reference=payload.provider_code,
                source_timestamp=context.collected_at,
                inconsistencies=list(identity_data.get("inconsistencias", [])),
                quality_score=identity_data.get("calidad"),
            ),
            evidences=[evidence],
            quality_warnings=[],
        )

    def normalize_subject(self, payload: ProviderPayload) -> dict[str, str | int | None]:
        person_data = payload.data.get("persona", {})
        return {
            "full_name": person_data.get("nombreCompleto"),
            "birth_date": person_data.get("fechaNacimiento"),
            "age": person_data.get("edad"),
            "email": person_data.get("email"),
            "phone": person_data.get("telefono"),
            "address": person_data.get("domicilio"),
            "locality": person_data.get("localidad"),
            "province": person_data.get("provincia"),
        }
