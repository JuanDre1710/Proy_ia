# Sprint 33 - Backend incremental en modo pending infrastructure

## Objetivo

Adaptar el backend incremental antifraude para que siga arrancando y respondiendo de forma clara aunque todavia no existan permisos para crear:

- `AF_MONITORED_CASES`
- `AF_INCREMENTAL_CONTROL`
- `AF_CASE_DECISION_HISTORY`

ni para garantizar el indice:

- `IX_SINIESTROS_SIN_FECAUD_SIN_ID`

## Resultado

La arquitectura incremental se mantiene.

Lo que cambia en este sprint es el modo de operacion:

- si la infraestructura existe, el subsistema opera normalmente
- si la infraestructura no existe, la API entra en modo `pending_infrastructure`
- el arranque no se bloquea
- los endpoints afectados responden con diagnostico explicito

## Cambios aplicados

### Deteccion explicita de infraestructura

Se agrego `AntifraudInfrastructureStatusService`.

Consulta en SQL Server:

- existencia de `AF_MONITORED_CASES`
- existencia de `AF_INCREMENTAL_CONTROL`
- existencia de `AF_CASE_DECISION_HISTORY`
- existencia del indice `IX_SINIESTROS_SIN_FECAUD_SIN_ID`

Resultado expuesto en:

- `GET /monitoring/diagnostics`

Estados:

- `ready`
- `pending_infrastructure`

### Startup seguro

Se elimino la creacion automatica de tablas al iniciar la API.

Ahora:

- el backend no asume permisos DDL
- no intenta crear infraestructura en startup
- no bloquea el arranque si faltan tablas

### Degradacion controlada

#### `POST /monitoring/run`

Si faltan tablas propias:

- sigue validando lectura incremental sobre la fuente
- sigue validando armado de caso y analisis
- no persiste resultados
- no avanza watermark persistido
- devuelve `status = pending_infrastructure`

#### `GET /monitoring/status/{process}`

Si faltan tablas propias:

- devuelve watermark transitorio
- `persistenceEnabled = false`
- informa mensaje de infraestructura pendiente

#### Bandeja y acciones humanas

Endpoints:

- `GET /monitoring/cases`
- `GET /monitoring/cases/{sinId}`
- `POST /monitoring/cases/{sinId}/decision`
- `POST /monitoring/cases/{sinId}/resolution`

Si faltan tablas propias:

- responden `503`
- cuerpo con `status = pending_infrastructure`
- diagnostico con objetos faltantes

## Scripts SQL manuales

Ubicacion:

- `sql/antifraud/`

Scripts versionados:

1. `001_create_af_monitored_cases.sql`
2. `002_create_af_incremental_control.sql`
3. `003_create_af_case_decision_history.sql`
4. `004_seed_af_incremental_control.sql`
5. `005_create_ix_af_monitored_cases_priority_date.sql`
6. `006_create_ix_siniestros_sin_fecaud_sin_id.sql`

Guia operativa:

- `sql/antifraud/README.md`

## Permisos requeridos para activacion futura

- `CREATE TABLE`
- `CREATE INDEX`
- `INSERT` sobre `AF_INCREMENTAL_CONTROL`

Para el indice sobre fuente ademas:

- permiso para `CREATE INDEX` sobre `dbo.SINIESTROS`

## Activacion futura

1. Ejecutar scripts SQL en el orden documentado.
2. Verificar `GET /monitoring/diagnostics`.
3. Confirmar `status = ready`.
4. Consultar `GET /monitoring/status/siniestros_incremental_monitor`.
5. Ejecutar `POST /monitoring/run`.
6. Validar persistencia en `AF_MONITORED_CASES`.
7. Validar bandeja y decisiones humanas.

## Garantias del diseno

Se conserva:

- watermark compuesto `SIN_FECAUD + SIN_ID`
- orden estable `SIN_FECAUD ASC, SIN_ID ASC`
- relectura acotada
- upsert idempotente por `SIN_ID`
- separacion entre base fuente y tablas propias

Lo unico suspendido temporalmente es:

- persistencia antifraude
- bandeja operativa persistida
- decisiones humanas persistidas

Hasta que la infraestructura exista fisicamente.
