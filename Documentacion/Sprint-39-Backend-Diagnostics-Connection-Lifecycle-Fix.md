# Sprint 39 - Backend fix ciclo de vida de conexion en diagnostico

## Problema

`GET /monitoring/diagnostics` devolvia `ready`, pero luego `GET /monitoring/cases` y `GET /monitoring/cases/{sinId}` fallaban con:

- `The ConnectionString property has not been initialized.`

## Causa raiz

`AntifraudInfrastructureStatusService` estaba usando `Database.GetDbConnection()` sobre el mismo `AntifraudDbContext` compartido por request y disponiendo esa conexion.

Despues, `OperationalCasesService` reutilizaba ese mismo `DbContext` para ejecutar LINQ sobre `MonitoredCases`, pero la conexion ya habia quedado invalidada.

## Correccion

- El diagnostico ahora usa una `SqlConnection` independiente creada a partir de la cadena configurada.
- Ya no se dispone ni altera la conexion interna del `DbContext` compartido por EF Core.

## Archivo impactado

- `Ers.SqlServerApi/Application/AntifraudInfrastructureStatusService.cs`

## Resultado esperado

- `GET /monitoring/diagnostics` sigue respondiendo igual.
- `GET /monitoring/cases`
- `GET /monitoring/cases/{sinId}`

ya no deberian fallar por el ciclo de vida de la conexion.
