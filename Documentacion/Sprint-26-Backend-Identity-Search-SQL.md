# Sprint 26 - Backend Identity Search SQL

## Objetivo

Implementar la búsqueda por identidad sobre la base SQL Server de desarrollo, devolviendo persona, pólizas asociadas y siniestros para selección posterior.

## Resultado

Se creó un host ASP.NET mínimo:

- `Ers.SqlServerApi`

Este host usa el adapter EF Core ya creado en `Ers.SqlServerAdapter` y expone un endpoint HTTP desacoplado de entidades EF.

## Endpoint

- `POST /identity/search`

Request:

```json
{
  "document": "27123456789",
  "documentType": "DNI"
}
```

`documentType` es opcional.

## Contrato de respuesta

```json
{
  "searchStatus": "multiple_claims",
  "person": {
    "personId": "123",
    "identifierValue": "27123456789",
    "identifierType": "CUIT",
    "documentType": "DNI",
    "documentNumber": "30111222",
    "taxId": "27123456789",
    "displayName": "Apellido Nombre",
    "email": "mail@dominio.com"
  },
  "policies": [
    {
      "policyNumber": "0001",
      "certificateNumber": "01",
      "policyStatus": "VIGENTE",
      "linkStatus": "ACTIVO",
      "policyCreatedAt": "2025-01-10T00:00:00",
      "policyPremium": 10000.00
    }
  ],
  "claims": [
    {
      "claimId": "555",
      "claimNumber": "SIN-2026-0001",
      "claimDate": "2026-03-01T10:30:00",
      "statusCode": "ABIERTO",
      "statusLabel": "ABIERTO",
      "claimType": "ROBO",
      "claimAmount": 150000.00,
      "claimedAmount": 180000.00,
      "policyNumber": "0001",
      "certificateNumber": "01"
    }
  ],
  "totalPolicies": 1,
  "totalClaims": 1,
  "hasSingleClaim": true,
  "requiresClaimSelection": false,
  "message": "Apellido Nombre fue encontrado/a con 1 siniestro asociado."
}
```

## Escenarios cubiertos

- `not_found`
- `person_without_claims`
- `single_claim`
- `multiple_claims`

## Implementación

Capas agregadas:

- `Ers.SqlServerApi/Application/IdentitySearchService.cs`
- `Ers.SqlServerApi/Application/IdentitySearchDtos.cs`
- `Ers.SqlServerApi/Program.cs`

Provider usado:

- `Ers.SqlServerAdapter/Infrastructure/DataAccess/Providers/SqlServerIdentityClaimProvider.cs`

## Notas de diseño

- No se exponen entidades EF Core fuera de infraestructura.
- La API devuelve DTOs propios.
- No se ejecuta scoring, reasoning ni pipeline IA.
- La respuesta ya queda lista para que frontend permita elegir siniestro.

## Configuración

Archivo ejemplo:

- `Ers.SqlServerApi/appsettings.example.json`

Se requiere definir:

- `ConnectionStrings:DefaultConnection`

## Estado de verificación

Verificado:

- compila el adapter EF Core
- compila la API ASP.NET con referencia al adapter

Pendiente:

- correr la API contra la base SQL Server real con la cadena de conexión efectiva
- validar nombres reales de estado y tipo de siniestro en datos de desarrollo

