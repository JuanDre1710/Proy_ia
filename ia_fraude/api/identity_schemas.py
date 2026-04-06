from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


IdentitySearchStatusApi = Literal[
    "not_found",
    "person_without_active_claims",
    "single_active_claim",
    "multiple_active_claims",
]


class IdentitySearchRequestDto(BaseModel):
    identifier: str = Field(min_length=1, max_length=20)
    requestedBy: str = Field(default="frontend-user", min_length=1, max_length=80)
    sourceChannel: str = Field(default="frontend")
    documentType: str | None = Field(default=None, max_length=30)


class IdentityPersonDto(BaseModel):
    personId: str
    identifierValue: str
    identifierType: str
    documentType: str | None = None
    documentNumber: str | None = None
    taxId: str | None = None
    displayName: str
    email: str | None = None


class IdentityClaimSummaryDto(BaseModel):
    claimId: str
    claimNumber: str
    occurredAt: str | None = None
    statusCode: str
    statusLabel: str
    claimedAmount: float | None = None
    estimatedAmount: float | None = None
    claimTypeId: str | None = None
    policyNumber: str | None = None
    certificateNumber: str | None = None


class IdentitySearchResponseDto(BaseModel):
    searchStatus: IdentitySearchStatusApi
    person: IdentityPersonDto | None = None
    activeClaims: list[IdentityClaimSummaryDto] = Field(default_factory=list)
    totalClaims: int = 0
    canAutoAnalyze: bool
    requiresClaimSelection: bool
    activeClaimStatusCodes: list[str] = Field(default_factory=list)
    message: str


class CaseFromClaimRequestDto(BaseModel):
    claimId: str = Field(min_length=1, max_length=80)
    requestedBy: str = Field(min_length=1, max_length=80)
    sourceChannel: str = Field(default="frontend")


class CaseFromClaimResponseDto(BaseModel):
    caseId: str
    claimId: str
    status: str
    message: str
    canOpenDashboard: bool = True
    requestedAt: str

