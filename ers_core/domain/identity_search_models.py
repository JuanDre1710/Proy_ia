from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True, slots=True)
class IdentitySearchQuery:
    normalized_identifier: str
    identifier_type: str
    document_type_hint: str | None = None


@dataclass(frozen=True, slots=True)
class PersonSearchRecord:
    person_id: str
    identifier_value: str
    identifier_type: str
    document_type: str | None
    document_number: str | None
    tax_id: str | None
    display_name: str
    email: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class ClaimRecord:
    claim_id: str
    person_id: str
    claim_number: str
    occurred_at: str | None
    status_code: str
    status_label: str
    claimed_amount: float | None
    estimated_amount: float | None
    claim_type_id: str | None
    policy_number: str | None
    certificate_number: str | None
    is_active_hint: bool | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class IdentitySearchResult:
    search_status: str
    person: PersonSearchRecord | None
    active_claims: list[ClaimRecord]
    total_claims: int
    can_auto_analyze: bool
    requires_claim_selection: bool


@dataclass(frozen=True, slots=True)
class CaseAssemblyPayload:
    claim_id: str
    person_id: str
    payload: dict[str, Any]

