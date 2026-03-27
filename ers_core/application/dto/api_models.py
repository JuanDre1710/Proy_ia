from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class ApiAlertDto:
    id: str
    severity: str
    title: str
    short_description: str
    detail: str
    source: str
    related_variable: str | None = None
    recommendation: str | None = None


@dataclass(slots=True)
class ApiReasoningDto:
    summary: str
    hypothesis: str
    confidence: float | None
    unresolved_questions: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ApiScoreDto:
    score: float
    category: str
    confidence: float | None = None
    model_version: str | None = None
    top_factors: list[dict[str, object]] = field(default_factory=list)


@dataclass(slots=True)
class ApiDecisionDto:
    status: str
    actor_id: str | None
    actor_role: str | None
    comment: str | None
    created_at: str


@dataclass(slots=True)
class ApiCaseDto:
    case_id: str
    requested_at: str
    general_status: str
    subject_name: str
    document_type: str
    document_number: str
    identity_status: str
    identity_verified: bool
    deceased: bool
    analyst_summary: str
    alerts: list[ApiAlertDto] = field(default_factory=list)
    reasoning: ApiReasoningDto | None = None
    score: ApiScoreDto | None = None
    decision: ApiDecisionDto | None = None


@dataclass(slots=True)
class UiCaseViewModel:
    case_id: str
    requested_at: str
    general_status: str
    full_name: str
    document_label: str
    risk_category: str
    analyst_summary: str
    alerts_count: int
    decision_status: str | None
