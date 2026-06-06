from __future__ import annotations

from ers_core.domain.identity_search_models import (
    CaseAssemblyPayload,
    ClaimRecord,
    IdentitySearchQuery,
    PersonSearchRecord,
)


class SqlServerDataProvider:
    """Placeholder contract for the enterprise provider.

    This repository runs a FastAPI/Python backend. The intended SQL Server enterprise
    implementation mentioned in the sprint uses EF Core and therefore must live in a
    .NET component that implements the same contracts exposed by this class.
    """

    def __init__(self, connection_string: str | None) -> None:
        self._connection_string = connection_string

    def search_person(self, query: IdentitySearchQuery) -> PersonSearchRecord | None:
        self._raise_unavailable()

    def list_claims_by_person(self, person_id: str) -> list[ClaimRecord]:
        self._raise_unavailable()

    def build_case_payload(self, claim_id: str) -> CaseAssemblyPayload | None:
        self._raise_unavailable()

    def _raise_unavailable(self) -> None:
        if not self._connection_string:
            raise RuntimeError(
                "ERS_ENTERPRISE_SQLSERVER_CONNECTION_STRING is not configured for sqlserver mode."
            )
        raise RuntimeError(
            "sqlserver mode requires a companion .NET provider that implements these contracts with "
            "Entity Framework Core and SQL Server. This Python backend keeps the domain contract ready "
            "but cannot host EF Core directly."
        )

