from __future__ import annotations

from typing import Protocol

from ers_core.domain.models import Case


class CaseRepository(Protocol):
    def save(self, case: Case) -> Case:
        """Create or update a case."""

    def list_all(self) -> list[Case]:
        """Return all cases."""

    def get_by_id(self, case_id: str) -> Case | None:
        """Return a case by id."""

    def count_by_user_and_day(self, user_id: str, day_iso: str) -> int:
        """Return the number of evaluations initiated by a user on the given day."""
