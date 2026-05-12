from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .enums import (
    AlertSeverity,
    AuditActionType,
    CaseProcessingState,
    AuditResultType,
    DecisionStatus,
    DocumentType,
    EvidenceQuality,
    EvidenceSourceType,
    IdentityLifecycleStatus,
    IntegrationStatus,
    ProviderType,
    RecommendationType,
    RiskCategory,
)


@dataclass(slots=True)
class Person:
    person_id: str
    full_name: str
    document_type: DocumentType
    document_number: str
    birth_date: str | None = None
    age: int | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    locality: str | None = None
    province: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class IdentityStatus:
    status: IdentityLifecycleStatus
    verified: bool
    deceased: bool
    source_reference: str | None = None
    source_timestamp: datetime | None = None
    inconsistencies: list[str] = field(default_factory=list)
    quality_score: float | None = None


@dataclass(slots=True)
class FinancialInfo:
    credit_score: int | None = None
    debt_ratio: float | None = None
    bancarization_level: str | None = None
    active_loans: int | None = None
    bounced_checks: int | None = None
    monthly_income_estimate: str | None = None
    observation: str | None = None
    source_reference: str | None = None
    quality_score: float | None = None
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class LaborFiscalInfo:
    tax_status: str | None = None
    main_activity: str | None = None
    employer_or_company: str | None = None
    income_bracket: str | None = None
    registered_employees: int | None = None
    fiscal_observation: str | None = None
    source_reference: str | None = None
    quality_score: float | None = None
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class Evidence:
    evidence_id: str
    source_type: EvidenceSourceType
    provider_code: str
    title: str
    summary: str
    details: str
    collected_at: datetime
    quality: EvidenceQuality = EvidenceQuality.UNKNOWN
    quality_score: float | None = None
    related_keys: list[str] = field(default_factory=list)
    attributes: dict[str, Any] = field(default_factory=dict)
    raw_reference_id: str | None = None


@dataclass(slots=True)
class Alert:
    alert_id: str
    severity: AlertSeverity
    title: str
    short_description: str
    detail: str
    source_type: EvidenceSourceType
    source_reference: str | None = None
    related_variable: str | None = None
    recommendation_hint: str | None = None
    evidence_ids: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ReasoningResult:
    reasoning_id: str
    engine_version: str
    summary: str
    hypothesis: str
    evidence_for_review: list[str] = field(default_factory=list)
    evidence_against_fraud: list[str] = field(default_factory=list)
    inconsistencies: list[str] = field(default_factory=list)
    missing_evidence: list[str] = field(default_factory=list)
    suggested_priority: str = "MEDIUM"
    suggested_next_checks: list[str] = field(default_factory=list)
    supporting_evidence_ids: list[str] = field(default_factory=list)
    contradictory_evidence_ids: list[str] = field(default_factory=list)
    unresolved_questions: list[str] = field(default_factory=list)
    confidence: float | None = None
    generated_at: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class ScoreResult:
    score_id: str
    model_name: str
    model_version: str
    score_value: float
    risk_category: RiskCategory
    confidence: float | None = None
    top_factors: list[dict[str, Any]] = field(default_factory=list)
    feature_contributions: dict[str, float] = field(default_factory=dict)
    evaluated_at: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class FinalAssessment:
    assessment_id: str
    case_id: str
    risk_category: RiskCategory
    recommendation: RecommendationType
    executive_summary: str
    requires_manual_review: bool = True
    blocked_by_hard_rules: bool = False
    final_status: str = "PENDING"
    final_priority: str = "MEDIUM"
    recommended_action: RecommendationType = RecommendationType.REVIEW
    confidence: float | None = None
    summary_for_analyst: str = ""
    evidence_quality: str | None = None
    pipeline_state: str | None = None
    hard_rule_reasons: list[str] = field(default_factory=list)
    alert_ids: list[str] = field(default_factory=list)
    reasoning_result_id: str | None = None
    score_result_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass(slots=True)
class ConsolidatedEvidence:
    bundle_id: str
    collected_at: datetime
    ready_for_rules: bool
    provider_statuses: dict[str, str] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
    evidence_ids: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class HardRuleFinding:
    code: str
    severity: str
    message: str
    justification: str
    evidence_refs: list[str] = field(default_factory=list)
    effect_on_pipeline: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class HardRuleEvaluation:
    evaluation_id: str
    evaluated_at: datetime
    findings: list[HardRuleFinding] = field(default_factory=list)
    final_effect: str = ""
    ready_for_reasoning: bool = False
    ready_for_scoring: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class RelationshipNode:
    node_id: str
    label: str
    node_type: str
    risk_level: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class RelationshipEdge:
    edge_id: str
    source: str
    target: str
    relationship_type: str
    severity: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class RelationshipSignal:
    code: str
    severity: str
    message: str
    related_case_ids: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class RelationshipGraph:
    graph_id: str
    generated_at: datetime
    nodes: list[RelationshipNode] = field(default_factory=list)
    edges: list[RelationshipEdge] = field(default_factory=list)
    signals: list[RelationshipSignal] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class Decision:
    decision_id: str
    case_id: str
    status: DecisionStatus
    actor_id: str | None = None
    actor_name: str | None = None
    actor_role: str | None = None
    comment: str | None = None
    rationale: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    supersedes_decision_id: str | None = None


@dataclass(slots=True)
class AuditLog:
    audit_id: str
    action: AuditActionType
    result: AuditResultType
    entity_type: str
    entity_id: str
    actor_id: str | None = None
    actor_role: str | None = None
    correlation_id: str | None = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    detail: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class ExportRecord:
    export_id: str
    case_id: str
    format: str
    filename: str
    file_path: str
    content_type: str
    size_bytes: int
    created_at: datetime = field(default_factory=datetime.utcnow)
    created_by_id: str | None = None
    created_by_name: str | None = None
    created_by_role: str | None = None
    status: str = "READY"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class IntegrationConfig:
    integration_id: str
    provider_type: ProviderType
    provider_code: str
    display_name: str
    status: IntegrationStatus
    enabled: bool
    base_url: str | None = None
    auth_type: str | None = None
    secret_ref: str | None = None
    timeout_ms: int = 5000
    retries: int = 0
    retry_policy: dict[str, Any] = field(default_factory=dict)
    mapping_profile: str | None = None
    settings: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    updated_by: str | None = None


@dataclass(slots=True)
class ConfiguredRule:
    rule_id: str
    name: str
    category: str
    severity: str
    status: str
    source: str | None = None
    description: str = ""
    rule_type: str = ""
    parameters: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    updated_by: str | None = None


@dataclass(slots=True)
class Case:
    case_id: str
    created_at: datetime
    updated_at: datetime
    requested_by: str | None
    source_channel: str
    processing_state: CaseProcessingState
    subject: Person
    identity_status: IdentityStatus
    validation_results: dict[str, str] = field(default_factory=dict)
    financial_info: FinancialInfo | None = None
    labor_fiscal_info: LaborFiscalInfo | None = None
    evidences: list[Evidence] = field(default_factory=list)
    alerts: list[Alert] = field(default_factory=list)
    reasoning_result: ReasoningResult | None = None
    score_result: ScoreResult | None = None
    final_assessment: FinalAssessment | None = None
    consolidated_evidence: ConsolidatedEvidence | None = None
    hard_rule_evaluation: HardRuleEvaluation | None = None
    relationship_graph: RelationshipGraph | None = None
    latest_decision: Decision | None = None
    decision_history: list[Decision] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
