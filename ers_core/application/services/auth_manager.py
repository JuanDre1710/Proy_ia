from __future__ import annotations

import hashlib
import secrets
from dataclasses import replace
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

from ers_core.application.ports.auth_repository import (
    AuthUserRecord,
    AuthUserRepository,
    RefreshTokenRecord,
    RefreshTokenRepository,
)
from ers_core.application.ports.integration_repository import AuditLogRepository
from ers_core.domain.enums import AuditActionType, AuditResultType
from ers_core.domain.models import AuditLog
from ers_core.security.jwt_utils import JwtValidationError, decode_jwt, encode_jwt
from ers_core.security.passwords import verify_password

ACCESS_TOKEN_SECONDS = 60 * 15
REFRESH_TOKEN_SECONDS = 60 * 60 * 24 * 7


class AuthenticationError(ValueError):
    pass


class AuthManager:
    def __init__(
        self,
        user_repository: AuthUserRepository,
        refresh_repository: RefreshTokenRepository,
        audit_repository: AuditLogRepository,
    ) -> None:
        self._user_repository = user_repository
        self._refresh_repository = refresh_repository
        self._audit_repository = audit_repository

    def login(self, username: str, password: str, client_ip: str | None) -> dict[str, Any]:
        user = self._user_repository.get_by_username(username)
        if user is None or not user.enabled or not verify_password(password, user.password_hash):
            self._audit("AUTH_LOGIN", "ERROR", "anonymous", None, "Invalid login attempt", client_ip)
            raise AuthenticationError("Credenciales invalidas.")

        updated_user = replace(user, last_login=datetime.utcnow().isoformat())
        self._user_repository.upsert(updated_user)
        session = self._issue_session(updated_user, client_ip)
        self._audit("AUTH_LOGIN", "OK", updated_user.user_id, updated_user.role, "Successful login", client_ip)
        return session

    def refresh(self, refresh_token: str, client_ip: str | None) -> dict[str, Any]:
        token_hash = self._hash_refresh_token(refresh_token)
        stored = self._refresh_repository.get_active(token_hash)
        if stored is None:
            self._audit("AUTH_LOGIN", "ERROR", "anonymous", None, "Invalid refresh token", client_ip)
            raise AuthenticationError("Refresh token invalido.")

        if datetime.fromisoformat(stored.expires_at) <= datetime.utcnow():
            self._refresh_repository.revoke(token_hash, "expired")
            raise AuthenticationError("Refresh token expirado.")

        user = self._user_repository.get_by_id(stored.user_id)
        if user is None or not user.enabled:
            self._refresh_repository.revoke(token_hash, "user_missing")
            raise AuthenticationError("Usuario no disponible.")

        self._refresh_repository.revoke(token_hash, "rotated")
        return self._issue_session(user, client_ip)

    def logout(self, refresh_token: str | None, actor_id: str | None, client_ip: str | None) -> None:
        if refresh_token:
            self._refresh_repository.revoke(self._hash_refresh_token(refresh_token), "logout")
        self._audit("AUTH_LOGOUT", "OK", actor_id or "anonymous", None, "Logout executed", client_ip)

    def me(self, access_token: str) -> dict[str, Any]:
        try:
            payload = decode_jwt(access_token, expected_type="access")
        except JwtValidationError as exc:
            raise AuthenticationError(str(exc)) from exc

        user = self._user_repository.get_by_id(str(payload["sub"]))
        if user is None or not user.enabled:
            raise AuthenticationError("Usuario no disponible.")

        return {
            "user": self._serialize_user(user),
            "expiresAt": datetime.utcfromtimestamp(payload["exp"]).isoformat(),
        }

    def _issue_session(self, user: AuthUserRecord, client_ip: str | None) -> dict[str, Any]:
        access_token = encode_jwt(
            {"sub": user.user_id, "role": user.role, "email": user.email},
            ACCESS_TOKEN_SECONDS,
            "access",
        )
        refresh_token_plain = secrets.token_urlsafe(48)
        refresh_token_hash = self._hash_refresh_token(refresh_token_plain)
        refresh_record = RefreshTokenRecord(
            token_id=f"RT-{uuid4().hex[:12].upper()}",
            user_id=user.user_id,
            token_hash=refresh_token_hash,
            expires_at=(datetime.utcnow() + timedelta(seconds=REFRESH_TOKEN_SECONDS)).isoformat(),
            created_at=datetime.utcnow().isoformat(),
            created_by_ip=client_ip,
        )
        self._refresh_repository.save(refresh_record)
        claims = decode_jwt(access_token, expected_type="access")
        return {
            "accessToken": access_token,
            "refreshToken": refresh_token_plain,
            "expiresAt": datetime.utcfromtimestamp(claims["exp"]).isoformat(),
            "user": self._serialize_user(user),
        }

    def _serialize_user(self, user: AuthUserRecord) -> dict[str, Any]:
        return {
            "id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "lastLogin": user.last_login,
        }

    def _hash_refresh_token(self, refresh_token: str) -> str:
        return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()

    def _audit(
        self,
        action: str,
        result: str,
        entity_id: str,
        actor_role: str | None,
        detail: str,
        client_ip: str | None,
    ) -> None:
        self._audit_repository.append(
            AuditLog(
                audit_id=f"AUD-{uuid4().hex[:10].upper()}",
                action=AuditActionType(action),
                result=AuditResultType(result),
                entity_type="AuthSession",
                entity_id=entity_id,
                actor_id=entity_id,
                actor_role=actor_role,
                correlation_id=None,
                detail=detail,
                metadata={"clientIp": client_ip} if client_ip else {},
            )
        )
