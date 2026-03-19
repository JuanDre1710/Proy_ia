from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Protocol

from ers_core.application.ports.provider_ports import ProviderPayload
from ers_core.domain.models import Alert, Evidence, FinancialInfo, IdentityStatus, LaborFiscalInfo


@dataclass(slots=True)
class MappingContext:
    provider_code: str
    integration_id: str | None = None
    collected_at: datetime = field(default_factory=datetime.utcnow)
    correlation_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class ExternalNormalizationResult:
    identity_status: IdentityStatus | None = None
    financial_info: FinancialInfo | None = None
    labor_fiscal_info: LaborFiscalInfo | None = None
    evidences: list[Evidence] = field(default_factory=list)
    alerts: list[Alert] = field(default_factory=list)
    quality_warnings: list[str] = field(default_factory=list)


class ExternalToDomainMapper(Protocol):
    def normalize(self, payload: ProviderPayload, context: MappingContext) -> ExternalNormalizationResult:
        """
        Convert an external provider payload into canonical domain structures.

        Rules:
        - Accept raw provider payloads only inside adapters.
        - Never expose raw payload shape to the domain or the frontend.
        - Compute evidence and quality signals during normalization.
        """

