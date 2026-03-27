from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


CaseProcessingStateApi = Literal[
    "accepted_for_processing",
    "invalid_identifier",
    "insufficient_input",
    "daily_limit_reached",
    "waiting_for_enrichment",
    "ready_for_rules",
    "ready_for_reasoning",
    "not_evaluable",
    "excluded",
    "scored",
]


class CaseAlertDto(BaseModel):
    id: str
    severity: str
    title: str
    shortDescription: str
    detail: str
    source: str
    relatedVariable: str | None = None
    recommendation: str | None = None


class CaseScoreDto(BaseModel):
    value: float
    category: str
    confidence: float | None = None
    modelVersion: str | None = None
    topFactors: list[dict[str, object]] = Field(default_factory=list)
    featureContributions: dict[str, float] = Field(default_factory=dict)


class CaseReasoningDto(BaseModel):
    reasoningSummary: str | None = None
    summary: str
    hypothesis: str
    evidenceForReview: list[str] = Field(default_factory=list)
    evidenceAgainstFraud: list[str] = Field(default_factory=list)
    inconsistencies: list[str] = Field(default_factory=list)
    missingEvidence: list[str] = Field(default_factory=list)
    suggestedPriority: str
    suggestedNextChecks: list[str] = Field(default_factory=list)
    confidence: float | None = None
    unresolvedQuestions: list[str] = Field(default_factory=list)


class CaseFinalAssessmentDto(BaseModel):
    finalStatus: str
    finalPriority: str
    recommendedAction: str
    confidence: float | None = None
    summaryForAnalyst: str
    evidenceQuality: str | None = None
    requiresManualReview: bool
    blockedByHardRules: bool
    hardRuleReasons: list[str] = Field(default_factory=list)


class CaseDecisionDto(BaseModel):
    decisionId: str | None = None
    caseId: str | None = None
    status: str
    decidedAt: str
    decidedById: str | None = None
    decidedBy: str | None = None
    decidedByRole: str | None = None
    comment: str | None = None
    rationale: str | None = None
    supersedesDecisionId: str | None = None
    workflowStatus: str | None = None


class CaseDecisionHistoryItemDto(BaseModel):
    decisionId: str
    caseId: str
    status: str
    decidedAt: str
    decidedById: str | None = None
    decidedBy: str | None = None
    decidedByRole: str | None = None
    comment: str | None = None
    rationale: str | None = None
    supersedesDecisionId: str | None = None


class CaseDecisionRequestDto(BaseModel):
    action: Literal["accept", "deny", "escalate"]
    comment: str = Field(min_length=1, max_length=500)
    actorId: str = Field(min_length=1, max_length=120)
    actorName: str | None = Field(default=None, max_length=160)
    actorRole: str | None = Field(default=None, max_length=120)


class CaseSubjectDto(BaseModel):
    fullName: str
    birthDate: str | None = None
    age: int | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    locality: str | None = None
    province: str | None = None
    verified: bool
    deceased: bool


class CaseFinancialInfoDto(BaseModel):
    creditScore: int | None = None
    debtRatio: float | None = None
    bancarizationLevel: str | None = None
    activeLoans: int | None = None
    bouncedChecks: int | None = None
    monthlyIncomeEstimate: str | None = None
    observation: str | None = None


class CaseLaborFiscalInfoDto(BaseModel):
    taxStatus: str | None = None
    mainActivity: str | None = None
    employerOrCompany: str | None = None
    incomeBracket: str | None = None
    registeredEmployees: int | None = None
    fiscalObservation: str | None = None


class CaseEvidenceSummaryDto(BaseModel):
    readyForRules: bool
    providerStatuses: dict[str, str] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    evidenceCount: int = 0


class CaseGraphNodeDto(BaseModel):
    id: str
    label: str
    type: str
    riskLevel: str
    metadata: dict = Field(default_factory=dict)


class CaseGraphEdgeDto(BaseModel):
    id: str
    source: str
    target: str
    relationshipType: str
    severity: str


class CaseGraphSignalDto(BaseModel):
    code: str
    severity: str
    message: str
    relatedCaseIds: list[str] = Field(default_factory=list)


class CaseGraphResponseDto(BaseModel):
    caseId: str
    nodes: list[CaseGraphNodeDto] = Field(default_factory=list)
    edges: list[CaseGraphEdgeDto] = Field(default_factory=list)
    signals: list[CaseGraphSignalDto] = Field(default_factory=list)


class CaseEvaluateRequestDto(BaseModel):
    identifier: str = Field(min_length=1, max_length=20)
    requestedBy: str = Field(min_length=1, max_length=80)
    sourceChannel: str = Field(default="frontend")


class CaseEvaluateResponseDto(BaseModel):
    caseId: str
    identifier: str
    identifierType: str | None = None
    status: CaseProcessingStateApi
    message: str
    canOpenDashboard: bool
    validationResults: dict[str, str]
    requestedAt: str


class CaseReadResponseDto(BaseModel):
    caseId: str
    identifier: str
    identifierType: str | None = None
    requestedBy: str | None = None
    requestedAt: str
    status: CaseProcessingStateApi
    sourceChannel: str
    validationResults: dict[str, str]
    metadata: dict
    subject: CaseSubjectDto
    financialInfo: CaseFinancialInfoDto | None = None
    laborFiscalInfo: CaseLaborFiscalInfoDto | None = None
    evidenceSummary: CaseEvidenceSummaryDto | None = None
    alerts: list[CaseAlertDto] = Field(default_factory=list)
    score: CaseScoreDto | None = None
    reasoning: CaseReasoningDto | None = None
    finalAssessment: CaseFinalAssessmentDto | None = None
    decision: CaseDecisionDto | None = None
    decisionHistory: list[CaseDecisionHistoryItemDto] = Field(default_factory=list)
