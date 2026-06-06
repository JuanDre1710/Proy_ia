# ERS Pipeline Order

## Mandatory execution order

The antifraud engine must respect this order:

1. ingestion and validation
2. normalization into the canonical domain model
3. hard rules / exclusion / not-evaluable checks
4. contextual reasoning over structured evidence
5. tabular scoring
6. final fusion of results
7. operational recommendation and auditable persistence

This order must not be inverted.

## Stage details

### 1. Ingestion and validation

Inputs may come from:

- UI request
- internal backend workflow
- batch ingestion
- external systems

Responsibilities:

- validate request integrity
- validate required identifiers
- validate source permissions and request context
- generate correlation ids

Outputs:

- validated input command

### 2. Normalization into the canonical domain model

Responsibilities:

- call provider adapters
- receive raw provider payloads
- translate them through anti-corruption mappers
- produce canonical entities:
  - person
  - identity status
  - financial info
  - labor fiscal info
  - evidence
  - alerts

Outputs:

- partially or fully populated canonical `Case`

Important rule:

- raw provider payloads stop here

### 3. Hard rules / exclusion / not-evaluable checks

Responsibilities:

- detect blocking conditions
- identify exclusion states
- detect insufficient data
- produce explicit reasons

Examples:

- deceased identity
- inconsistent identity
- missing minimum data
- blocked policy state

Outputs:

- case may be marked as blocked or not evaluable before scoring

Important rule:

- scoring must not run before these checks

### 4. Contextual reasoning over structured evidence

Responsibilities:

- inspect normalized evidence
- inspect evidence quality and contradictions
- formulate a structured hypothesis
- identify unresolved questions

Inputs allowed:

- canonical evidence
- derived alerts
- hard-rule outcomes

Inputs forbidden:

- raw provider payloads

### 5. Tabular scoring

Responsibilities:

- compute score over canonical, validated features
- classify risk category
- expose top factors and contributions

Inputs allowed:

- normalized and validated features only

Important rule:

- score must not run before evidence consolidation

### 6. Final fusion of results

Responsibilities:

- combine hard rules
- combine reasoning
- combine score
- determine final risk category
- determine business recommendation

Typical outcomes:

- approve
- review
- deny
- escalate
- request more information
- block

### 7. Operational recommendation and auditable persistence

Responsibilities:

- persist final assessment
- persist decision if any
- persist audit logs
- preserve traceability to evidence, reasoning and score

Important rule:

- every critical action must be audit-ready

## Cross-cutting constraints

### Constraint 1

The frontend is not coupled to provider payloads.

### Constraint 2

The domain is not coupled to provider payloads.

### Constraint 3

Reasoning does not consume raw external payloads.

### Constraint 4

Score does not execute before hard rules and evidence consolidation.

### Constraint 5

Integration configuration remains externalized and admin-configurable.

