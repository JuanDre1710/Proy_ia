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
4. `004_seed_af_incremental_control.sql`
5. `005_create_ix_af_monitored_cases_priority_date.sql`
6. `006_create_ix_siniestros_sin_fecaud_sin_id.sql`

## Permisos requeridos

- `CREATE TABLE` sobre la base destino
- `CREATE INDEX` sobre las tablas propias
- `CREATE INDEX` sobre `dbo.SINIESTROS` para el script `006`
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

## Nota operativa

Mientras esta infraestructura no exista, la API arranca en modo degradado:

- `GET /monitoring/diagnostics` informa faltantes
- `POST /monitoring/run` valida lectura/armado/analisis sin persistencia
- `GET /cases` no puede persistir decisiones manuales
- la bandeja y decisiones responden `pending_infrastructure`
