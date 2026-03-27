from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


IntegrationKind = Literal["API REST", "Webhook", "Batch", "Base de datos"]
ProviderTypeApi = Literal["IDENTITY", "FINANCIAL", "LABOR_FISCAL", "RELATIONSHIP", "DOCUMENT"]
IntegrationRuntimeStatus = Literal["ACTIVE", "DEGRADED", "DISABLED", "TESTING"]
AuthTypeApi = Literal["API Key", "OAuth2", "Basic", "Ninguna"]


class IntegrationConfigCreateRequest(BaseModel):
    code: str = Field(min_length=2, max_length=60)
    providerType: ProviderTypeApi
    integrationKind: IntegrationKind
    displayName: str = Field(min_length=2, max_length=120)
    baseUrl: HttpUrl | None = None
    authType: AuthTypeApi | None = None
    secretRef: str | None = None
    timeoutMs: int = Field(default=5000, ge=250, le=60000)
    retries: int = Field(default=0, ge=0, le=10)
    status: IntegrationRuntimeStatus = "ACTIVE"
    enabled: bool = True
    detail: str = Field(default="")
    metadata: dict[str, Any] = Field(default_factory=dict)
    settings: dict[str, Any] = Field(default_factory=dict)
    updatedBy: str | None = None


class IntegrationConfigUpdateRequest(IntegrationConfigCreateRequest):
    pass


class IntegrationEnabledRequest(BaseModel):
    enabled: bool
    updatedBy: str | None = None


class ConnectivityTestResponse(BaseModel):
    success: bool
    statusCode: int | None = None
    latencyMs: int | None = None
    message: str


class IntegrationConfigResponse(BaseModel):
    id: str
    code: str
    providerType: ProviderTypeApi
    integrationKind: IntegrationKind
    displayName: str
    baseUrl: str | None = None
    authType: str | None = None
    secretConfigured: bool = False
    timeoutMs: int
    retries: int
    status: IntegrationRuntimeStatus
    enabled: bool
    detail: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)
    settings: dict[str, Any] = Field(default_factory=dict)
    updatedAt: str
    updatedBy: str | None = None
