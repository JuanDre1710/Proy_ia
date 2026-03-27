from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

from ers_core.domain.models import IntegrationConfig


@dataclass(slots=True)
class ProviderRequest:
    subject_identifier: str
    identifier_type: str
    case_id: str | None = None
    correlation_id: str | None = None
    context: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class ProviderPayload:
    provider_code: str
    received_at: str
    data: dict[str, Any]
    metadata: dict[str, Any] = field(default_factory=dict)


class IdentityProvider(Protocol):
    def fetch_identity(self, request: ProviderRequest, config: IntegrationConfig) -> ProviderPayload:
        """Return raw provider payload for identity sources."""


class FinancialProvider(Protocol):
    def fetch_financial_profile(self, request: ProviderRequest, config: IntegrationConfig) -> ProviderPayload:
        """Return raw provider payload for financial sources."""


class LaborFiscalProvider(Protocol):
    def fetch_labor_fiscal_profile(self, request: ProviderRequest, config: IntegrationConfig) -> ProviderPayload:
        """Return raw provider payload for labor/fiscal sources."""


class FutureRelationshipProvider(Protocol):
    def fetch_relationships(self, request: ProviderRequest, config: IntegrationConfig) -> ProviderPayload:
        """Return raw provider payload for future relationship intelligence."""


class FutureDocumentProvider(Protocol):
    def fetch_documents(self, request: ProviderRequest, config: IntegrationConfig) -> ProviderPayload:
        """Return raw provider payload for future document intelligence."""
