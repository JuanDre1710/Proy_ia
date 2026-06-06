from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Header, HTTPException, Request, Response

from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_auth_user_repository import FileAuthUserRepository
from ers_core.adapters.repositories.file_refresh_token_repository import FileRefreshTokenRepository
from ers_core.config.app_settings import get_settings
from ers_core.application.services.auth_manager import AuthManager, AuthenticationError
from .auth_schemas import AuthSessionDto, LogoutRequestDto, LoginRequestDto, MeDto, RefreshRequestDto

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

_user_repository = FileAuthUserRepository(settings.data_dir / "auth_users.json")
_refresh_repository = FileRefreshTokenRepository(settings.data_dir / "auth_refresh_tokens.json")
_audit_repository = FileAuditLogRepository(settings.data_dir / "audit_logs.jsonl")
_auth_manager = AuthManager(_user_repository, _refresh_repository, _audit_repository)


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    return authorization[len("Bearer ") :]


@router.post("/login", response_model=AuthSessionDto)
def login(payload: LoginRequestDto, request: Request) -> AuthSessionDto:
    try:
        session = _auth_manager.login(payload.username, payload.password, request.client.host if request.client else None)
    except AuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return AuthSessionDto(**session)


@router.post("/refresh", response_model=AuthSessionDto)
def refresh(payload: RefreshRequestDto, request: Request) -> AuthSessionDto:
    try:
        session = _auth_manager.refresh(payload.refreshToken, request.client.host if request.client else None)
    except AuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return AuthSessionDto(**session)


@router.post("/logout", status_code=204, response_class=Response)
def logout(payload: LogoutRequestDto, request: Request, authorization: str | None = Header(default=None)) -> Response:
    actor_id = None
    if authorization and authorization.startswith("Bearer "):
      try:
          actor_id = _auth_manager.me(_bearer_token(authorization))["user"]["id"]
      except AuthenticationError:
          actor_id = None
    _auth_manager.logout(payload.refreshToken, actor_id, request.client.host if request.client else None)
    return Response(status_code=204)


@router.get("/me", response_model=MeDto)
def me(authorization: str | None = Header(default=None)) -> MeDto:
    try:
        data = _auth_manager.me(_bearer_token(authorization))
    except AuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return MeDto(**data)
