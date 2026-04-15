# Sprint 38 - Backend guardrails de ConnectionString

## Objetivo

Evitar que el subsistema antifraude llegue a ejecutar EF Core con `ConnectionString` vacia o no cargada.

## Problema observado

La API podia llegar a instanciar `AntifraudDbContext` con `SqlConnection.ConnectionString` vacia y terminar fallando en runtime con:

- `System.InvalidOperationException: The ConnectionString property has not been initialized.`

## Cambios implementados

- `AntifraudInfrastructureStatusService`
  - valida `Database.GetConnectionString()`
  - valida `DbConnection.ConnectionString`
  - si falta configuracion, devuelve diagnostico degradado en vez de dejar avanzar a EF
- `Ers.SqlServerApi.Infrastructure.Persistence.ServiceCollectionExtensions`
  - resuelve `DefaultConnection` de forma explicita y consistente
- `Ers.SqlServerAdapter.Infrastructure.Persistence.ServiceCollectionExtensions`
  - aplica la misma resolucion para evitar diferencias entre contexts

## Resultado esperado

Si la cadena no esta configurada correctamente:

- los endpoints de monitoreo deberian responder `pending_infrastructure`
- el diagnostico deberia indicar que falta `DefaultConnection`
- no deberia aparecer la excepcion interna de EF por `ConnectionString` sin inicializar

## Archivos impactados

- `Ers.SqlServerApi/Application/AntifraudInfrastructureStatusService.cs`
- `Ers.SqlServerApi/Infrastructure/Persistence/ServiceCollectionExtensions.cs`
- `Ers.SqlServerAdapter/Infrastructure/Persistence/ServiceCollectionExtensions.cs`

## Verificacion

- Se intento `dotnet build Ers.SqlServerApi.csproj -v minimal`
- La compilacion no pudo finalizar porque el binario estaba bloqueado por un proceso activo de `Ers.SqlServerApi`

## Recomendacion operativa

1. Detener la API en ejecucion.
2. Recompilar.
3. Levantar nuevamente la API.
4. Probar:
   - `GET /monitoring/diagnostics`
   - `GET /monitoring/cases`
5. Si sigue faltando cadena:
   - revisar `appsettings.Development.json`
   - revisar variables de entorno `ConnectionStrings__DefaultConnection`
   - revisar desde que directorio/proyecto se esta levantando la API
