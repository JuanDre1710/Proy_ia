from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(slots=True)
class AuthUserRecord:
    user_id: str
    username: str
    password_hash: str
    name: str
    email: str
    role: str
    last_login: str | None = None
    enabled: bool = True


@dataclass(slots=True)
class RefreshTokenRecord:
    token_id: str
    user_id: str
    token_hash: str
    expires_at: str
    created_at: str
    created_by_ip: str | None = None
    revoked_at: str | None = None
    revoked_reason: str | None = None


class AuthUserRepository(Protocol):
    def get_by_username(self, username: str) -> AuthUserRecord | None:
        """Return a user by normalized username."""

    def get_by_id(self, user_id: str) -> AuthUserRecord | None:
        """Return a user by id."""

    def upsert(self, user: AuthUserRecord) -> AuthUserRecord:
        """Create or update a user record."""


class RefreshTokenRepository(Protocol):
    def save(self, token: RefreshTokenRecord) -> RefreshTokenRecord:
        """Persist a refresh token."""

    def get_active(self, token_hash: str) -> RefreshTokenRecord | None:
        """Return an active refresh token by hash."""

    def revoke(self, token_hash: str, reason: str) -> None:
        """Revoke a refresh token."""

