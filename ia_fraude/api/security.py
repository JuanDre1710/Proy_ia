from __future__ import annotations

from pathlib import Path

from fastapi import Header, HTTPException

from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_auth_user_repository import FileAuthUserRepository
from ers_core.adapters.repositories.file_refresh_token_repository import FileRefreshTokenRepository
from ers_core.config.app_settings import get_settings
from ers_core.application.services.auth_manager import AuthManager, AuthenticationError

settings = get_settings()
_user_repository = FileAuthUserRepository(settings.data_dir / "auth_users.json")
_refresh_repository = FileRefreshTokenRepository(settings.data_dir / "auth_refresh_tokens.json")
_audit_repository = FileAuditLogRepository(settings.data_dir / "audit_logs.jsonl")
_auth_manager = AuthManager(_user_repository, _refresh_repository, _audit_repository)


def resolve_actor(
    authorization: str | None,
    x_actor_id: str | None,
    x_actor_name: str | None,
    x_actor_role: str | None,
) -> dict[str, str | None]:
    if authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer ") :]
        try:
            session = _auth_manager.me(token)
        except AuthenticationError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc
        user = session["user"]
        return {
            "id": user["id"],
            "name": user["name"],
            "role": user["role"],
        }

    return {
        "id": x_actor_id or "frontend-user",
        "name": x_actor_name or x_actor_id or "Usuario frontend",
        "role": x_actor_role or "Evaluador",
    }


def require_actor(
    authorization: str | None = Header(default=None),
    x_actor_id: str | None = Header(default=None),
    x_actor_name: str | None = Header(default=None),
    x_actor_role: str | None = Header(default=None),
) -> dict[str, str | None]:
    return resolve_actor(authorization, x_actor_id, x_actor_name, x_actor_role)


def require_roles(actor: dict[str, str | None], allowed_roles: set[str]) -> None:
    if str(actor.get("role")) not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions.")
