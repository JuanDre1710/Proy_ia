# ERS Domain Model

## Purpose

This document defines the canonical internal model for ERS. Its role is to isolate business meaning from:

- frontend view models
- API DTOs
- external provider payloads
- current mock structures

The canonical domain is the stable center of the system.

## Design goals

- keep domain semantics stable while providers evolve
- avoid leaking provider field names into business logic
- allow the frontend to evolve independently from backend internals
- make the IA pipeline consume normalized evidence only
- support auditability and operational decisions

## Canonical entities

### Case

Represents the aggregate root for an antifraud evaluation process.

Main responsibilities:

- identify the case
- reference the evaluated subject
- store normalized evidence and alerts
- store reasoning, score and final assessment
- keep the latest operational decision

Core fields:

- `case_id`
- `created_at`
- `updated_at`
- `requested_by`
- `source_channel`
- `subject`
- `identity_status`
- `financial_info`
- `labor_fiscal_info`
- `evidences`
- `alerts`
- `reasoning_result`
- `score_result`
- `final_assessment`
- `latest_decision`

### Person

Canonical representation of an individual or legal entity subject.

Important rule:

- this entity must not use provider-native field names

Core fields:

- `person_id`
- `full_name`
- `document_type`
- `document_number`
- `birth_date`
- `age`
- `email`
- `phone`
- `address`
- `locality`
- `province`

### IdentityStatus

Represents the normalized identity outcome for the subject.

Possible lifecycle states:

- `VERIFIED`
- `UNVERIFIED`
- `DECEASED`
- `INCONSISTENT`
- `NOT_FOUND`
- `INSUFFICIENT_DATA`

This entity is important because hard rules may stop the pipeline before scoring.

### FinancialInfo

Canonical financial profile used by rules, reasoning and scoring.

Example fields:

- `credit_score`
- `debt_ratio`
- `bancarization_level`
- `active_loans`
- `bounced_checks`
- `monthly_income_estimate`

### LaborFiscalInfo

Canonical labor and tax profile.

Example fields:

- `tax_status`
- `main_activity`
- `employer_or_company`
- `income_bracket`
- `registered_employees`
- `fiscal_observation`

### Evidence

Normalized evidence fragment collected from external or internal sources.

Each evidence record should capture:

- source type
- provider code
- summary
- details
- collected time
- quality and quality score
- trace reference to the raw payload

Important rule:

- raw provider payload is never embedded here; only a reference or trace id

### Alert

Business-facing signal derived from normalized evidence or internal rules.

Properties:

- severity
- title
- summary
- detail
- source type
- related variable
- linked evidence ids

Important rule:

- alerts belong to the domain and are not provider-native messages copied as-is

### ReasoningResult

Structured output of contextual reasoning over normalized evidence.

Contains:

- summary
- hypothesis
- supporting evidence ids
- contradictory evidence ids
- unresolved questions
- confidence

Important rule:

- the reasoning stage consumes normalized evidence and derived alerts only
- it must not inspect raw third-party payloads

### ScoreResult

Structured output of the tabular scoring stage.

Contains:

- model name
- model version
- score value
- risk category
- top factors
- feature contributions

Important rule:

- scoring runs only after validation, normalization and hard rules

### FinalAssessment

Final synthesis of rules, reasoning and score.

Contains:

- final risk category
- recommendation
- executive summary
- hard-rule blocking status
- reasons for exclusion or block
- references to reasoning and score

### Decision

Operational action taken by a user or system after the assessment.

Examples:

- accept
- deny
- escalate
- cancel

This is separate from `FinalAssessment` because recommendation and human decision are not the same concept.

### AuditLog

Immutable operational trace.

Must be ready to record:

- actor
- action
- result
- entity type/id
- correlation id
- timestamp
- detail and metadata

### IntegrationConfig

Configuration record for external providers and integrations.

Contains:

- provider type
- provider code
- display name
- status
- enablement
- base url
- auth type
- timeout
- retry policy
- mapping profile
- provider-specific settings

Important rule:

- providers are configured at runtime from admin settings, not hardcoded in business logic

## Layer boundaries

### UI / frontend models

Purpose:

- optimize screen rendering and local UI state

Rule:

- the UI model can diverge from API DTOs when needed

### API DTOs

Purpose:

- provide a stable transport contract to frontend consumers

Rule:

- API DTOs are not raw domain entities

### Domain model

Purpose:

- represent business meaning and pipeline state

Rule:

- domain must not depend on provider schemas

### External payloads

Purpose:

- transient integration data only

Rule:

- they stay inside adapters and anti-corruption mappers

