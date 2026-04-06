# Sprint 24 - Backend IA

## Objetivo

Implementar un flujo desacoplado de busqueda por identidad y armado de casos desde siniestros, manteniendo:

- modo demo/local operativo sin red corporativa
- dominio y pipeline desacoplados del origen de datos
- frontend desacoplado de tablas o payloads SQL crudos

## Arquitectura aplicada

Se agregaron tres contratos de acceso a datos:

- `IPersonSearchProvider`
- `IClaimQueryProvider`
- `ICaseDataProvider`

Sobre esos contratos se montaron dos implementaciones:

- `DemoClaimsProvider`
  - resuelve personas por DNI/CUIT/CUIL
  - devuelve siniestros y payload canonico para armar el caso
  - no depende de red corporativa
- `SqlServerDataProvider`
  - queda como contrato empresarial explicito
  - en este repo Python no ejecuta EF Core
  - documenta que la implementacion real debe vivir en un componente .NET que use:
    - `Microsoft.EntityFrameworkCore`
    - `Microsoft.EntityFrameworkCore.SqlServer`
    - `UseSqlServer(cfg.GetConnectionString("DefaultConnection"))`

## Backend nuevo

Servicios:

- `IdentitySearchService`
  - busca persona por identidad
  - resuelve siniestros del cliente
  - identifica siniestros activos segun configuracion
  - devuelve estado funcional para frontend
- `CaseAssemblyService`
  - toma un `claimId`
  - pide el payload canonico al provider
  - arma el `Case` via `InternalCaseAnalysisService`
  - deja el caso listo para dashboard, reasoning y scoring

Endpoints:

- `POST /identity/search`
- `POST /identity/cases/from-claim`

## Contrato de respuesta de busqueda

`/identity/search` devuelve:

- `searchStatus`
- `person`
- `activeClaims`
- `totalClaims`
- `canAutoAnalyze`
- `requiresClaimSelection`
- `activeClaimStatusCodes`
- `message`

Escenarios cubiertos:

- `not_found`
- `person_without_active_claims`
- `single_active_claim`
- `multiple_active_claims`

## Configuracion

Variables nuevas:

- `ERS_IDENTITY_DATA_PROVIDER`
  - `demo`
  - `sqlserver`
- `ERS_ACTIVE_CLAIM_STATUS_CODES`
  - default: `OPEN,IN_REVIEW,PENDING_ANALYSIS`
- `ERS_ENTERPRISE_SQLSERVER_CONNECTION_STRING`
  - reservada para el adaptador empresarial

## Trazabilidad

Se dejaron eventos de auditoria nuevos:

- `IDENTITY_SEARCHED`
- `CLAIM_SELECTED`
- `CASE_ASSEMBLED_FROM_CLAIM`

## Frontend conectado

Sin recrear pantallas:

- la busqueda ahora consulta `/identity/search`
- si hay un solo siniestro activo, crea el caso automaticamente
- si hay multiples, muestra seleccion explicita y luego llama a `/identity/cases/from-claim`
- el dashboard recibe `claimsHistory` desde el backend

## Limitacion explicita del modo empresa

El requerimiento de EF Core no es ejecutable dentro de este repo porque no existe un proyecto .NET/C# en el workspace y el backend actual es FastAPI.

Por eso en este sprint se hizo lo correcto para no acoplar:

- el dominio queda estable
- el contrato de datos queda estable
- el modo demo funciona hoy
- el modo empresa queda preparado para una implementacion .NET separada sin reescribir frontend ni pipeline

