# ERS Integration Strategy

## Goal

Define how ERS consumes external providers without coupling the domain or frontend to third-party payloads.

## Architectural principle

External providers are replaceable implementation details.

That means:

- frontend models must remain independent from provider payloads
- domain entities must remain independent from provider payloads
- business rules must operate on canonical entities only
- reasoning and scoring must operate on canonical evidence only

## Folder strategy

New architectural base:

```text
ers_core/
  domain/
    enums.py
    models.py
  application/
    dto/
      api_models.py
    mappers/
      domain_to_api.py
      api_to_ui.py
    ports/
      provider_ports.py
  adapters/
    anti_corruption/
      external_to_domain.py
```

## Provider adapter strategy

Adapters are split into two responsibilities:

### 1. Provider client responsibility

The provider adapter is responsible for:

- calling the external service
- handling authentication
- handling HTTP or transport details
- returning a raw `ProviderPayload`

It is not responsible for:

- business rules
- risk decisions
- frontend shaping

### 2. Anti-corruption mapping responsibility

The anti-corruption mapper is responsible for:

- translating raw payloads into canonical domain entities
- computing evidence objects
- deriving initial quality warnings
- producing normalized alerts when needed

It is not responsible for:

- final API DTO shaping
- UI-specific formatting

## Required provider ports

The application defines these abstract provider interfaces:

- `IdentityProvider`
- `FinancialProvider`
- `FutureRelationshipProvider`
- `FutureDocumentProvider`

This means the rest of the system depends on ports, not concrete provider implementations.

## Mapping path

The intended mapping path is:

1. external provider payload
2. anti-corruption mapper
3. canonical domain entities
4. domain/application orchestration
5. API DTO
6. UI model

In short:

- `external -> domain`
- `domain -> api dto`
- `api dto -> ui model`

## Decoupling rules

### Rule 1

The frontend must never consume raw provider payloads.

### Rule 2

The domain must never depend on provider-native formats or field names.

### Rule 3

The IA reasoning stage must only consume normalized evidence and alerts.

### Rule 4

The scoring stage must consume canonical features only.

### Rule 5

Provider-specific secrets, URLs and auth modes must live in integration configuration, not in domain logic.

### Rule 6

Replacing one provider with another should require adapter changes, not domain or frontend changes.

## Admin configurability

All external integrations should be configurable through the existing admin module.

Expected configurable dimensions:

- provider enablement
- base URL
- auth type
- timeouts
- retries
- mapping profile
- provider-specific settings
- health status

## Migration strategy from mocks

To preserve current frontend behavior during migration:

1. keep frontend mocks working
2. introduce backend DTOs matching functional intent, not provider shape
3. make service adapters swappable behind the same use-case boundary
4. replace mock data source by backend endpoints incrementally

## What is intentionally not defined yet

This sprint does not define:

- final external payload contracts
- final REST endpoint payloads
- concrete provider implementations
- productive scoring logic
- productive reasoning logic

Those remain open by design to avoid premature coupling.

