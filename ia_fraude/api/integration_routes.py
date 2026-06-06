from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, Response, status

from ers_core.adapters.factories.integration_adapter_factory import IntegrationAdapterFactory
from ers_core.adapters.repositories.file_audit_log_repository import FileAuditLogRepository
from ers_core.adapters.repositories.file_integration_repository import FileIntegrationConfigRepository
from ers_core.config.app_settings import get_settings
from ers_core.application.services.integration_manager import IntegrationManager
from ers_core.domain.enums import IntegrationStatus, ProviderType
from ers_core.domain.models import IntegrationConfig
from .integration_schemas import (
    ConnectivityTestResponse,
    IntegrationConfigCreateRequest,
    IntegrationConfigResponse,
    IntegrationConfigUpdateRequest,
    IntegrationEnabledRequest,
)

router = APIRouter(prefix="/admin/integrations", tags=["admin-integrations"])
settings = get_settings()

_repository = FileIntegrationConfigRepository(settings.data_dir / "integration_configs.json")
_audit_repository = FileAuditLogRepository(settings.data_dir / "audit_logs.jsonl")
_manager = IntegrationManager(_repository, _audit_repository, IntegrationAdapterFactory())


def _to_response(integration: IntegrationConfig) -> IntegrationConfigResponse:
    integration_kind = integration.settings.get("integrationKind", "API REST")
    return IntegrationConfigResponse(
        id=integration.integration_id,
        code=integration.provider_code,
        providerType=integration.provider_type.value,  # type: ignore[arg-type]
        integrationKind=integration_kind,  # type: ignore[arg-type]
        displayName=integration.display_name,
        baseUrl=integration.base_url,
        authType=integration.auth_type,
        secretConfigured=bool(integration.secret_ref),
        timeoutMs=integration.timeout_ms,
        retries=integration.retries,
        status=integration.status.value,  # type: ignore[arg-type]
        enabled=integration.enabled,
        detail=str(integration.metadata.get("detail", "")),
        metadata=integration.metadata,
        settings=integration.settings,
        updatedAt=integration.updated_at.isoformat(),
        updatedBy=integration.updated_by,
    )


@router.get("", response_model=list[IntegrationConfigResponse])
def list_integrations() -> list[IntegrationConfigResponse]:
    return [_to_response(item) for item in _manager.list_integrations()]


@router.get("/active", response_model=list[IntegrationConfigResponse])
def list_active_integrations(providerType: str | None = None) -> list[IntegrationConfigResponse]:
    provider_type = ProviderType(providerType) if providerType else None
    return [_to_response(item) for item in _manager.list_active_integrations(provider_type)]


@router.get("/{integration_id}", response_model=IntegrationConfigResponse)
def get_integration(integration_id: str) -> IntegrationConfigResponse:
    integration = _manager.get_integration(integration_id)
    if integration is None:
        raise HTTPException(status_code=404, detail="Integration not found.")
    return _to_response(integration)


@router.post("", response_model=IntegrationConfigResponse, status_code=status.HTTP_201_CREATED)
def create_integration(payload: IntegrationConfigCreateRequest) -> IntegrationConfigResponse:
    integration = _manager.create_integration(
        code=payload.code,
        provider_type=ProviderType(payload.providerType),
        display_name=payload.displayName,
        base_url=str(payload.baseUrl) if payload.baseUrl else None,
        auth_type=payload.authType,
        secret_ref=payload.secretRef,
        timeout_ms=payload.timeoutMs,
        retries=payload.retries,
        status=IntegrationStatus(payload.status),
        enabled=payload.enabled,
        metadata={**payload.metadata, "detail": payload.detail},
        settings={**payload.settings, "integrationKind": payload.integrationKind},
        updated_by=payload.updatedBy,
    )
    return _to_response(integration)


@router.put("/{integration_id}", response_model=IntegrationConfigResponse)
def update_integration(
    integration_id: str,
    payload: IntegrationConfigUpdateRequest,
) -> IntegrationConfigResponse:
    try:
        integration = _manager.update_integration(
            integration_id,
            code=payload.code,
            provider_type=ProviderType(payload.providerType),
            display_name=payload.displayName,
            base_url=str(payload.baseUrl) if payload.baseUrl else None,
            auth_type=payload.authType,
            secret_ref=payload.secretRef,
            timeout_ms=payload.timeoutMs,
            retries=payload.retries,
            status=IntegrationStatus(payload.status),
            enabled=payload.enabled,
            metadata={**payload.metadata, "detail": payload.detail},
            settings={**payload.settings, "integrationKind": payload.integrationKind},
            updated_by=payload.updatedBy,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _to_response(integration)


@router.patch("/{integration_id}/enabled", response_model=IntegrationConfigResponse)
def set_enabled(integration_id: str, payload: IntegrationEnabledRequest) -> IntegrationConfigResponse:
    try:
        integration = _manager.set_enabled(integration_id, payload.enabled, payload.updatedBy)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _to_response(integration)


@router.post("/{integration_id}/test-connectivity", response_model=ConnectivityTestResponse)
def test_connectivity(integration_id: str, updatedBy: str | None = None) -> ConnectivityTestResponse:
    try:
        result = _manager.test_connectivity(integration_id, updatedBy)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ConnectivityTestResponse(**result)


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_integration(integration_id: str, updatedBy: str | None = None) -> Response:
    deleted = _manager.delete_integration(integration_id, updatedBy)
    if not deleted:
        raise HTTPException(status_code=404, detail="Integration not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
