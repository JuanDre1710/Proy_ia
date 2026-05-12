# SQL manual - antifraud incremental monitoring

## Objetivo

Estos scripts preparan la infraestructura minima para que el backend incremental antifraude persista:

- casos monitoreados
- watermark de procesamiento
- historial de decisiones
- indices de soporte

## Orden de ejecucion

1. `001_create_af_monitored_cases.sql`
2. `002_create_af_incremental_control.sql`
3. `003_create_af_case_decision_history.sql`
4. `007_align_af_incremental_control_schema.sql`
5. `004_seed_af_incremental_control.sql`
6. `005_create_ix_af_monitored_cases_priority_date.sql`
7. `006_create_ix_siniestros_sin_fecaud_sin_id.sql`

El script `007` alinea instalaciones legacy donde `AF_INCREMENTAL_CONTROL` ya existia con columnas antiguas, por ejemplo `PROCESO` en lugar de `PROCESS_NAME`.

## Permisos requeridos

- `CREATE TABLE` sobre la base destino
- `CREATE INDEX` sobre las tablas propias
- `CREATE INDEX` sobre `dbo.SINIESTROS` para el script `006`
- `ALTER TABLE` sobre `dbo.AF_INCREMENTAL_CONTROL` para el script `007`
- `INSERT` sobre `dbo.AF_INCREMENTAL_CONTROL` para el seed inicial

## Activacion posterior

Una vez ejecutados los scripts:

1. consultar `GET /monitoring/diagnostics`
2. verificar `status = ready`
3. abrir `GET /cases` y verificar que la bandeja operativa ya puede listar siniestros pendientes
4. registrar una decision manual con `POST /cases/{sinId}/decision`
5. consultar `GET /monitoring/status/siniestros_incremental_monitor`
6. ejecutar `POST /monitoring/run` si se desea precargar casos ya analizados automaticamente
7. validar persistencia en `AF_MONITORED_CASES`

## Opcion desde la API

Si la API SQL corre con un usuario que tiene permisos DDL sobre la base, se puede pedir la creacion desde:

- `POST /monitoring/infrastructure/apply`

La ruta ejecuta los scripts versionados de `sql/antifraud/` en orden y devuelve el diagnostico actualizado.

## Auto bootstrap en desarrollo

La API puede intentar aplicar estos scripts automaticamente al arrancar si se configura:

```json
"AntifraudInfrastructure": {
  "AutoApplyOnStartup": true,
  "FailStartupIfApplyFails": false
}
```

- `AutoApplyOnStartup=true` ejecuta los scripts al iniciar
- `FailStartupIfApplyFails=true` hace fallar el arranque si no pudo crear la infraestructura

## Diagnostico de conectividad

Si `GET /monitoring/diagnostics` devuelve:

- `status = connection_not_configured`: falta `ConnectionStrings:DefaultConnection`
- `status = sql_unreachable`: la API no pudo conectarse a SQL Server
- `status = pending_infrastructure`: conecto a SQL Server pero faltan tablas, columnas o indices
- `status = ready`: la infraestructura minima existe

Si SQL Server falla con errores de cifrado del cliente en este entorno, usar una cadena local con `Encrypt=False;TrustServerCertificate=True`. La configuracion actual del backend SQL quedo ajustada asi para `VM2016MACRODI`.

## Validacion de primera corrida

Secuencia minima recomendada:

1. `GET /monitoring/diagnostics` debe devolver `status = ready`.
2. `GET /monitoring/status/siniestros_incremental_monitor` muestra el watermark inicial.
3. Ejecutar `POST /monitoring/run` con un lote chico, por ejemplo:

```json
{
  "batchSize": 5,
  "lookbackDays": 0,
  "maxBatches": 1,
  "process": "siniestros_incremental_monitor"
}
```

4. Validar que la respuesta tenga `status = completed`, `processedCount`, `insertedCount` y `updatedCount`.
5. Consultar `AF_INCREMENTAL_CONTROL` para confirmar avance de `ULTIMA_FECHA_PROCESADA + ULTIMO_ID_PROCESADO`.
6. Consultar `AF_MONITORED_CASES` para confirmar que `SIN_ID` no se duplique y que existan `SCORE`, `PRIORIDAD`, `ESTADO_CASO`, `RESUMEN_PREVIEW` y `ALERTAS`.
7. Repetir con `lookbackDays > 0` para confirmar relectura acotada con updates y sin duplicados.

## Nota operativa

Mientras esta infraestructura no exista, la API arranca en modo degradado:

- `GET /monitoring/diagnostics` informa faltantes
- `POST /monitoring/run` valida lectura/armado/analisis sin persistencia
- `GET /cases` no puede persistir decisiones manuales
- la bandeja y decisiones responden `pending_infrastructure`
