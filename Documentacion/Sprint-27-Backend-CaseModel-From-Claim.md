# Sprint 27 - Backend CaseModel From Claim

## Objetivo

Permitir seleccionar un siniestro específico y construir un `CaseModel` interno canónico, listo para ser consumido por reglas, reasoning y scoring en sprints posteriores.

## Resultado

Se agregó en `Ers.SqlServerApi`:

- `Application/CaseModel.cs`
- `Application/CaseAssemblyDtos.cs`
- `Application/CaseAssemblyService.cs`

Y se expuso el endpoint:

- `POST /cases/from-claim`

## Request

```json
{
  "claimId": "555"
}
```

## Respuesta

```json
{
  "caseKey": "CASE-555",
  "person": {
    "personId": "123",
    "displayName": "Apellido Nombre",
    "documentNumber": "30111222",
    "taxId": "27123456789",
    "email": "mail@dominio.com"
  },
  "policy": {
    "policyNumber": "0001",
    "certificateNumber": "01",
    "policyStatus": "VIGENTE",
    "linkStatus": "ACTIVO",
    "policyCreatedAt": "2025-01-10T00:00:00",
    "policyPremium": 10000.00
  },
  "selectedClaim": {
    "claimId": "555",
    "claimNumber": "SIN-2026-0001",
    "claimDate": "2026-03-01T10:30:00",
    "statusCode": "ABIERTO",
    "claimType": "ROBO",
    "claimAmount": 150000.00,
    "claimedAmount": 180000.00
  },
  "claimHistory": [],
  "historicalFeatures": {
    "totalClaims": 4,
    "claimsLast365Days": 3,
    "averageHistoricalAmount": 126500.50,
    "daysSincePreviousClaim": 42,
    "daysBetweenPolicyCreationAndClaim": 416
  },
  "message": "Caso interno construido desde el siniestro seleccionado. Listo para reglas, reasoning y scoring en sprints posteriores."
}
```

## Qué entra al CaseModel

- identidad básica de la persona
- datos de póliza/certificado vinculados al siniestro seleccionado
- datos de vigencia disponibles hoy desde la capa SQL:
  - número de póliza
  - número de certificado
  - premio
  - fecha de alta de póliza
  - estado de póliza
  - estado del vínculo póliza-siniestro
- datos del siniestro seleccionado
- historial de siniestros del cliente
- features históricas básicas calculadas

## Features históricas calculadas

- `totalClaims`
  - cantidad total de siniestros asociados al cliente
- `claimsLast365Days`
  - cantidad de siniestros dentro de los 365 días previos al siniestro seleccionado
- `averageHistoricalAmount`
  - promedio histórico usando `claimedAmount` y, si falta, `claimAmount`
- `daysSincePreviousClaim`
  - días entre el siniestro seleccionado y el último siniestro previo del cliente
- `daysBetweenPolicyCreationAndClaim`
  - días entre `PZA_FECALTA` y la fecha del siniestro seleccionado

## Separación de capas

- entidades EF Core
  - quedan en `Ers.SqlServerAdapter/Infrastructure/Persistence/Entities`
- contratos desacoplados
  - quedan en `Ers.SqlServerAdapter/Contracts`
- modelo de dominio/caso
  - queda en `Ers.SqlServerApi/Application/CaseModel.cs`
- DTOs HTTP
  - quedan en `Ers.SqlServerApi/Application/CaseAssemblyDtos.cs`

## Qué todavía no está resuelto

No se incorporan todavía:

- RENAPER
- Nosis
- enriquecimientos documentales externos
- reasoning/LLM
- scoring
- reglas de negocio finales

Tampoco se eligió automáticamente un siniestro cuando existen múltiples: el endpoint requiere `claimId` explícito.

