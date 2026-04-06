# Sprint 29 - Integracion de dashboard con backend SQL

## Objetivo del sprint

Desacoplar el dashboard de casos del backend Python para los casos originados en SQL Server, permitiendo abrir `/cases/{caseId}` con detalle consolidado y score operativo real desde `Ers.SqlServerApi`.

## Cambios implementados

### Backend SQL (.NET)

Se agrego una capa de detalle de caso para dashboard:

- `Ers.SqlServerApi/Application/CaseDashboardService.cs`
- `Ers.SqlServerApi/Application/CaseDashboardDtos.cs`

Nuevos endpoints:

- `GET /cases/{caseId}`
- `GET /cases/{caseId}/graph`

Comportamiento:

- `GET /cases/{caseId}` reconstruye el `CaseModel` desde el `claimId` contenido en el `caseId` (`CASE-{claimId}`), ejecuta el analisis operativo y devuelve un payload compatible con el dashboard actual del frontend.
- `GET /cases/{caseId}/graph` devuelve un grafo vacio controlado para no romper la UI mientras no exista una red relacional SQL modelada.

### Frontend

Archivo ajustado:

- `ers-frontend/src/services/caseService.ts`

Cambios:

- deteccion de `caseId` SQL mediante prefijo `CASE-`
- para esos casos, `getCaseById` consume `VITE_SQL_API_BASE_URL`
- el flujo `createCaseFromClaim` ahora permite abrir el dashboard inmediatamente despues de seleccionar el siniestro

## Contrato operativo para casos SQL

El backend SQL devuelve un shape alineado al contrato que ya consume `mapBackendCase` en frontend:

- `caseId`
- `identifier`
- `identifierType`
- `requestedAt`
- `status`
- `validationResults`
- `metadata`
- `subject`
- `financialInfo`
- `laborFiscalInfo`
- `claimsHistory`
- `alerts`
- `score`
- `reasoning`
- `finalAssessment`

## Decisiones de diseno

- Se mantuvo el backend Python para auth, exportaciones y flujos legacy.
- El dashboard ahora resuelve detalle desde SQL solo cuando el caso fue originado en el flujo SQL.
- No se acoplo el frontend a entidades EF ni a tablas SQL.
- No se habilito todavia persistencia de decisiones manuales en el backend SQL.

## Limitaciones conocidas

- `GET /cases/{caseId}/graph` devuelve grafo vacio.
- La tarjeta de resolucion manual no se habilita para casos SQL porque aun no existe endpoint SQL de decision persistida.
- La exportacion sigue cayendo en fallback local del frontend para estos casos si el backend Python no conoce el `caseId`.

## Verificacion realizada

- `dotnet build Ers.SqlServerApi.csproj -v minimal`
- `npm run build`

## Proximo sprint sugerido

1. Persistir evaluaciones SQL y decisiones manuales.
2. Exponer exportaciones propias para casos SQL.
3. Modelar un grafo relacional inicial desde datos reales si el negocio lo requiere.
