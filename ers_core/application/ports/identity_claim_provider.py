from __future__ import annotations

from typing import Protocol

from ers_core.domain.identity_search_models import (
    CaseAssemblyPayload,
    ClaimRecord,
    IdentitySearchQuery,
    PersonSearchRecord,
)


class IPersonSearchProvider(Protocol):
    def search_person(self, query: IdentitySearchQuery) -> PersonSearchRecord | None:
        """Resolve a person from an identity key."""


class IClaimQueryProvider(Protocol):
    def list_claims_by_person(self, person_id: str) -> list[ClaimRecord]:
        """Return all claims associated with a person."""


class ICaseDataProvider(Protocol):
    def build_case_payload(self, claim_id: str) -> CaseAssemblyPayload | None:
        """Return canonical payload data to assemble a case from a selected claim."""

