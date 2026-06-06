# Sprint 44 - Backend incremental lookback validation

## Objetivo

Cerrar la validacion operativa del backend .NET/SQL antes de agregar nuevas funcionalidades.

Foco del sprint:

- compilar `Ers.SqlServerApi`
- verificar connection string
- validar diagnostico de monitoreo
- corregir la relectura incremental acotada
- mantener upsert idempotente por `SIN_ID`
- asegurar respuestas controladas cuando la infraestructura no esta lista

## Estado final

Estado: parcial por bloqueo externo de SQL.

Hecho:

- el backend compila
- `GET /monitoring/diagnostics` responde sin tirar la API
- `POST /monitoring/run` responde de forma controlada si SQL no esta disponible
- el lookback incremental ya no queda anulado por el watermark persistido
- el watermark no retrocede cuando se reprocesan registros del lookback
- el upsert sigue siendo por `SIN_ID`

No confirmado en runtime:

- lectura real de `SINIESTROS`
- escenario real `pending_infrastructure` con SQL disponible pero tablas AF faltantes
- persistencia real en `AF_MONITORED_CASES`

Motivo:

- SQL Server rechazo la conexion desde esta maquina por cifrado del cliente:
  - .NET/SqlClient: `sql_20`
  - `sqlcmd`: `Encryption not supported on the client`

## Archivos tocados

- `Ers.SqlServerApi/Application/IncrementalMonitoringService.cs`
- `Ers.SqlServerAdapter/Contracts/IdentitySearchContracts.cs`
- `Ers.SqlServerAdapter/Infrastructure/DataAccess/Providers/SqlServerIdentityClaimProvider.cs`
- `Ers.SqlServerApi/Application/AntifraudInfrastructureStatusService.cs`
- `Documentacion/Sprint-44-Backend-Incremental-Lookback-Validation.md`

## Build

Comando ejecutado:

```powershell
dotnet build Ers.SqlServerApi\Ers.SqlServerApi.csproj -v minimal -o artifacts\incremental-lookback-validation
```

Resultado:

- compilacion correcta
- `0 Advertencia(s)`
- `0 Errores`

## Connection string

Configuracion revisada:

- `Ers.SqlServerApi/appsettings.json`
- `Ers.SqlServerApi/appsettings.Development.json`

Connection string configurada:

```json
"DefaultConnection": "Server=VM2016MACRODI;Database=iSol_Macro_NET_Fase2;User Id=innovacion;Password=innovacion;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
```

Configuracion antifraude:

- `appsettings.json`
  - `AutoApplyOnStartup = false`
  - `FailStartupIfApplyFails = false`
- `appsettings.Development.json`
  - `AutoApplyOnStartup = true`
  - `FailStartupIfApplyFails = false`

## Diagnostics

Endpoint validado:

- `GET /monitoring/diagnostics`

Respuesta observada:

```json
{
  "persistenceEnabled": false,
  "status": "sql_unreachable",
  "message": "No se pudo conectar a SQL Server para verificar la infraestructura antifraude.",
  "connectionAvailable": false,
  "failureCode": "sql_20"
}
```

Conclusion:

- el endpoint responde `200`
- informa estado operativo claro
- la API no se cae
- no se pudo llegar a validar existencia real de tablas AF por bloqueo de conexion SQL

## Monitoring run

Endpoint validado:

- `POST /monitoring/run`

Body usado:

```json
{
  "batchSize": 1,
  "lookbackDays": 1,
  "maxBatches": 1,
  "process": "siniestros_incremental_monitor"
}
```

Respuesta observada:

```json
{
  "process": "siniestros_incremental_monitor",
  "status": "sql_unreachable",
  "processedCount": 0,
  "lastProcessedClaimId": null,
  "lastProcessedAuditDate": null,
  "persistenceEnabled": false,
  "validationOnly": true
}
```

Conclusion:

- si SQL no esta disponible, el endpoint no intenta leer siniestros
- responde estado diagnostico controlado
- no devuelve `500`

## Watermark

El watermark sigue siendo compuesto:

- `SIN_FECAUD`
- `SIN_ID`

El estado persistido vive en:

- `AF_INCREMENTAL_CONTROL`

El proceso usa por defecto:

- `siniestros_incremental_monitor`

## Lookback

Problema corregido:

- antes se calculaba `readFromDate = watermark - lookbackDays`
- pero el cursor de SQL seguia usando estrictamente el watermark persistido
- eso hacia que la relectura acotada no fuera una relectura real

Comportamiento actual:

- `readFromDate = persistedWatermarkDate - LookbackDays`
- `scanDate = readFromDate`
- si `LookbackDays = 0`, `scanId = persistedWatermarkId`
- si `LookbackDays > 0`, `scanId = 0`

Consulta incremental efectiva:

```sql
WHERE sin.SIN_FECAUD >= @readFromDate
  AND (
        sin.SIN_FECAUD > @cursorDate
        OR (sin.SIN_FECAUD = @cursorDate AND sin.SIN_ID > @cursorClaimId)
      )
ORDER BY sin.SIN_FECAUD ASC, sin.SIN_ID ASC
```

Esto permite volver a leer registros dentro de la ventana de lookback.

## Avance del watermark

El watermark no retrocede.

Regla aplicada:

- si no se proceso nada, queda igual
- si el ultimo registro procesado esta despues del watermark persistido, avanza
- si el ultimo registro procesado pertenece solo al lookback anterior, queda igual

Esto evita que una relectura acotada reprograme el proceso hacia atras.

## Upsert

El upsert sigue centralizado en:

- `MonitoredCaseUpsertService`

Clave operativa:

- `SIN_ID`

La tabla esperada tiene indice unico:

- `UX_AF_MONITORED_CASES_SIN_ID`

Comportamiento esperado:

- si el siniestro no existe en `AF_MONITORED_CASES`, se inserta
- si ya existe, se actualiza
- una relectura por lookback no deberia duplicar casos

## Pending infrastructure

Cuando SQL responde pero falta infraestructura AF:

- `persistenceEnabled = false`
- `status = pending_infrastructure`
- `POST /monitoring/run` limita la ejecucion a una corrida de validacion sin persistir
- `MonitoredCaseUpsertService` no persiste si la infraestructura no esta lista
- los endpoints de bandeja/decision devuelven respuesta controlada mediante `AntifraudInfrastructureMissingException`

Tablas AF esperadas:

- `AF_MONITORED_CASES`
- `AF_INCREMENTAL_CONTROL`
- `AF_CASE_DECISION_HISTORY`

No confirmado en runtime en este sprint:

- el caso exacto de tablas AF faltantes, porque SQL no abre conexion desde el cliente actual

## Validaciones ejecutadas

Build:

- `dotnet build Ers.SqlServerApi\Ers.SqlServerApi.csproj -v minimal -o artifacts\incremental-lookback-validation`
- resultado correcto

API:

- arranque de `Ers.SqlServerApi.dll` en puerto local temporal
- `GET /monitoring/diagnostics`
- `POST /monitoring/run`

SQL:

- `sqlcmd -S VM2016MACRODI -d iSol_Macro_NET_Fase2 -U innovacion -P innovacion`
- resultado: falla por cifrado no soportado en el cliente

## Pendientes

Bloqueadores:

- resolver conectividad SQL desde esta maquina o entorno de ejecucion
- confirmar si el servidor requiere cifrado incompatible con el cliente instalado
- validar si se necesita actualizar ODBC Driver / SQL Server client / configuracion TLS

Backend:

- revalidar `GET /monitoring/diagnostics` cuando SQL conecte
- ejecutar `POST /monitoring/run` con tablas AF faltantes para confirmar `pending_infrastructure`
- ejecutar `POST /monitoring/run` con tablas AF presentes para confirmar persistencia
- validar que `AF_MONITORED_CASES` no duplica por `SIN_ID` tras una relectura con lookback

Base de datos:

- aplicar o validar scripts en `sql/antifraud`
- confirmar existencia de `UX_AF_MONITORED_CASES_SIN_ID`
- confirmar indice recomendado `IX_SINIESTROS_SIN_FECAUD_SIN_ID`

QA operativo:

- correr dos ejecuciones consecutivas con el mismo watermark y `lookbackDays > 0`
- verificar que el segundo run no duplica casos
- verificar que el watermark solo avanza si aparece una tupla posterior
