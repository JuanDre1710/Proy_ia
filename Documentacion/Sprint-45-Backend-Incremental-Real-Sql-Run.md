# Sprint 45 - Backend incremental real SQL run

## Objetivo

Poner en marcha el monitoreo incremental contra SQL Server real usando las tablas `AF_*` y validar la primera corrida end-to-end.

## Estado final

Estado: funcionando contra SQL real.

Hecho:

- SQL Server conecta desde backend con `Encrypt=False`
- `GET /monitoring/diagnostics` queda en `ready`
- tablas `AF_*` presentes
- indice fuente `IX_SINIESTROS_SIN_FECAUD_SIN_ID` presente
- primera corrida incremental real completada
- relectura con lookback validada
- `AF_MONITORED_CASES` persiste score, prioridad, estado, resumen y alertas
- `AF_INCREMENTAL_CONTROL` avanza watermark compuesto
- no hay duplicados por `SIN_ID`

## Cambios realizados

- `Ers.SqlServerApi/appsettings.json`
  - `Encrypt=False` para conectar con `VM2016MACRODI`
- `Ers.SqlServerApi/appsettings.Development.json`
  - mismo ajuste de connection string
- `Ers.SqlServerApi/Application/MonitoringDtos.cs`
  - se agregaron `insertedCount` y `updatedCount`
- `Ers.SqlServerApi/Application/IncrementalMonitoringService.cs`
  - logs de inicio, fin, watermark final y errores parciales
  - conteo de insertados/actualizados
- `Ers.SqlServerApi/Application/MonitoredCaseUpsertService.cs`
  - devuelve si el upsert fue insert o update
- `Ers.SqlServerAdapter/Infrastructure/DataAccess/Providers/SqlServerIdentityClaimProvider.cs`
  - `CAST(sin.SIN_ID AS bigint)` para evitar error de materializacion EF
- `Ers.SqlServerApi/Application/AntifraudInfrastructureStatusService.cs`
  - diagnostics valida columnas de `AF_INCREMENTAL_CONTROL`
- `Ers.SqlServerApi/Application/AntifraudInfrastructureService.cs`
  - incluye script `007`
- `sql/antifraud/007_align_af_incremental_control_schema.sql`
  - alinea `AF_INCREMENTAL_CONTROL` legacy
- `sql/antifraud/README.md`
  - documenta orden, puesta en marcha y troubleshooting

## Infraestructura SQL validada

Objetos presentes:

- `AF_MONITORED_CASES`
- `AF_INCREMENTAL_CONTROL`
- `AF_CASE_DECISION_HISTORY`
- `IX_SINIESTROS_SIN_FECAUD_SIN_ID`
- `UX_AF_MONITORED_CASES_SIN_ID`
- `UX_AF_INCREMENTAL_CONTROL_PROCESS_NAME`

Hallazgo:

- `AF_INCREMENTAL_CONTROL` existia con esquema legacy:
  - `PROCESO`
  - `ULTIMO_ID_PROCESADO int`
  - primary key sobre `ID`

Correccion:

- se aplico `007_align_af_incremental_control_schema.sql`
- `PROCESO` fue alineado a `PROCESS_NAME`
- `ULTIMO_ID_PROCESADO` quedo como `bigint`
- se agrego indice unico por `PROCESS_NAME`
- se dejo seed para `siniestros_incremental_monitor`

## Primera corrida real

Request:

```json
{
  "batchSize": 5,
  "lookbackDays": 0,
  "maxBatches": 1,
  "process": "siniestros_incremental_monitor"
}
```

Watermark antes:

- `ULTIMA_FECHA_PROCESADA = 2012-02-03T17:22:11.893`
- `ULTIMO_ID_PROCESADO = 0`
- `ESTADO = failed` por una corrida previa fallida de casteo

Respuesta:

```json
{
  "status": "completed",
  "processedCount": 5,
  "insertedCount": 5,
  "updatedCount": 0,
  "lastProcessedClaimId": "6",
  "lastProcessedAuditDate": "2012-02-03T17:22:11.893",
  "persistenceEnabled": true,
  "validationOnly": false
}
```

Watermark despues:

- `ULTIMA_FECHA_PROCESADA = 2012-02-03T17:22:11.893`
- `ULTIMO_ID_PROCESADO = 6`
- `ESTADO = completed`
- `MENSAJE_ERROR = null`

## Relectura con lookback

Request:

```json
{
  "batchSize": 5,
  "lookbackDays": 1,
  "maxBatches": 1,
  "process": "siniestros_incremental_monitor"
}
```

Respuesta:

```json
{
  "status": "completed",
  "processedCount": 5,
  "insertedCount": 0,
  "updatedCount": 5,
  "lastProcessedClaimId": "6",
  "lastProcessedAuditDate": "2012-02-03T17:22:11.893"
}
```

Resultado:

- la relectura fue real
- el upsert actualizo los mismos 5 casos
- no hubo duplicados
- el watermark no retrocedio

## Persistencia validada

Conteo final:

- `AF_MONITORED_CASES`: 8 casos totales
- `COUNT(DISTINCT SIN_ID)`: 8
- duplicados por `SIN_ID`: 0

Casos validados de la corrida:

- `SIN_ID`: 1, 2, 4, 5, 6
- `SCORE`: presente
- `PRIORIDAD`: presente
- `ESTADO_CASO`: presente
- `RESUMEN_PREVIEW`: presente
- `ALERTAS`: presente

Tambien se valido:

- `GET /monitoring/cases?take=10` responde `200`
- devuelve casos persistidos con `isPersisted = true`

## Logs

Logs agregados y observados:

- corrida iniciada
- watermark inicial
- `ReadFrom`
- batch size y max batches
- corrida terminada
- procesados, insertados y actualizados
- watermark final
- errores parciales por `SIN_ID` si un item falla

Ejemplo observado:

- primera corrida:
  - procesados 5
  - insertados 5
  - actualizados 0
  - watermark final `2012-02-03T17:22:11.893 / 6`
- lookback:
  - procesados 5
  - insertados 0
  - actualizados 5
  - watermark final `2012-02-03T17:22:11.893 / 6`

## Build

Comando:

```powershell
dotnet build Ers.SqlServerApi\Ers.SqlServerApi.csproj -v minimal -o artifacts\incremental-real-validation
```

Resultado:

- compilacion correcta
- `0 Advertencia(s)`
- `0 Errores`

## Troubleshooting

Conexion SQL:

- si aparece error de cifrado del cliente, usar `Encrypt=False;TrustServerCertificate=True`
- `sqlcmd` en esta maquina no fue confiable para esta validacion; se uso backend/API y `System.Data.SqlClient`

Infraestructura:

- si diagnostics devuelve `pending_infrastructure`, revisar `missingObjects`
- si falta `AF_INCREMENTAL_CONTROL.PROCESS_NAME`, aplicar scripts incluyendo `007_align_af_incremental_control_schema.sql`
- si falta `IX_SINIESTROS_SIN_FECAUD_SIN_ID`, aplicar `006_create_ix_siniestros_sin_fecaud_sin_id.sql`

Operacion:

- correr primeros lotes chicos para evitar procesar todo el backlog historico
- validar duplicados despues de cada relectura:

```sql
SELECT SIN_ID, COUNT(*) AS Repeticiones
FROM dbo.AF_MONITORED_CASES
GROUP BY SIN_ID
HAVING COUNT(*) > 1;
```

- validar watermark:

```sql
SELECT *
FROM dbo.AF_INCREMENTAL_CONTROL
WHERE PROCESS_NAME = 'siniestros_incremental_monitor';
```

## Pendientes recomendados

- definir tamano de lote operativo para procesar el backlog completo de 301.896 siniestros pendientes
- monitorear tiempos antes de subir `batchSize` y `maxBatches`
- revisar warnings EF de precision decimal para `MONTO_RECLAMO` y `MONTO_PAGADO`
