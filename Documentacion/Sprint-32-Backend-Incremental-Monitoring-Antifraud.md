# Sprint 32 - Backend incremental monitoring y persistencia antifraude

## Objetivo

Implementar la base backend para monitoreo incremental de `SINIESTROS` sin releer toda la tabla en cada inicio, usando:

- watermark compuesto `SIN_FECAUD + SIN_ID`
- orden estable `SIN_FECAUD ASC, SIN_ID ASC`
- relectura acotada
- upsert idempotente por `SIN_ID`
- persistencia en tablas propias del sistema antifraude

## Diseno aplicado

Se mantuvo separacion entre:

- base fuente operativa SQL Server
- tablas propias antifraude para monitoreo y operacion
- armado de caso desde `SIN_ID`
- analisis de riesgo operativo
- API para bandeja y acciones humanas

El acceso incremental a la tabla fuente se incorporo en el adapter SQL Server con un contrato especifico:

- `IIncrementalClaimProvider`

Ese provider devuelve lotes ordenados por:

- `SIN_FECAUD ASC`
- `SIN_ID ASC`

con filtro incremental sobre watermark compuesto.

## Tablas propias

Se agrego `AntifraudDbContext` con estas tablas:

- `AF_MONITORED_CASES`
- `AF_INCREMENTAL_CONTROL`
- `AF_CASE_DECISION_HISTORY`

### `AF_MONITORED_CASES`

Representa una fila por `SIN_ID` analizado.

Campos principales:

- `CASE_ID`
- `SIN_ID` con unicidad
- `CLI_ID`
- `PZA_NROSOL`
- `PVI_ID`
- `PSI_ID`
- `NRO_SINIESTRO`
- `NRO_POLIZA`
- `NRO_CERTIFICADO`
- `FECHA_SINIESTRO`
- `MONTO_RECLAMO`
- `MONTO_PAGADO`
- `SCORE`
- `NIVEL_RIESGO`
- `PRIORIDAD`
- `ESTADO_CASO`
- `DECISION`
- `FRAUDE_CONFIRMADO`
- `USUARIO_DECISION`
- `FECHA_DECISION`
- `COMENTARIO`
- `RESUMEN_PREVIEW`
- `ALERTAS`
- `FECHA_CREACION`
- `FECHA_ULTIMA_EVALUACION`
- `HASH_DATOS`
- `SOURCE_AUDIT_DATE`
- `SOURCE_LOAD_DATE`
- `CASE_SNAPSHOT_JSON`
- `ANALYSIS_SNAPSHOT_JSON`

### `AF_INCREMENTAL_CONTROL`

Guarda control por proceso:

- `PROCESS_NAME`
- `ULTIMA_FECHA_PROCESADA`
- `ULTIMO_ID_PROCESADO`
- `ULTIMA_EJECUCION`
- `ESTADO`
- `MENSAJE_ERROR`

### `AF_CASE_DECISION_HISTORY`

Historial tecnico-operativo de decisiones y resoluciones:

- `HISTORY_ID`
- `CASE_ID`
- `SIN_ID`
- `ACTION_TYPE`
- `DECISION`
- `FRAUDE_CONFIRMADO`
- `USUARIO`
- `COMENTARIO`
- `FECHA_ACCION`

## Servicios implementados

### Inicializacion

- `AntifraudInfrastructureService`

Responsabilidad:

- crear tablas propias si no existen
- intentar crear el indice recomendado `IX_SINIESTROS_SIN_FECAUD_SIN_ID`
- no bloquear la infraestructura propia si falla el indice sobre fuente

### Watermark

- `IncrementalWatermarkService`

Responsabilidad:

- crear o leer estado del proceso incremental
- marcar `running`
- marcar `completed` solo al final exitoso
- marcar `failed` sin avanzar watermark

### Upsert

- `MonitoredCaseUpsertService`

Responsabilidad:

- insertar o actualizar por `SIN_ID`
- persistir snapshot del caso y del analisis
- calcular `HASH_DATOS`
- conservar estado operativo humano ya existente

### Monitoreo incremental

- `IncrementalMonitoringService`

Flujo:

1. lee watermark persistido
2. calcula `readFromDate = ultima_fecha_procesada - lookback`
3. consulta lotes incrementales ordenados por `SIN_FECAUD, SIN_ID`
4. reconstruye caso por `SIN_ID`
5. ejecuta el analisis actual del sistema
6. hace upsert idempotente en `AF_MONITORED_CASES`
7. si la corrida completa bien, actualiza watermark con el ultimo tuple procesado
8. si falla, registra estado `failed` y no avanza watermark

### Bandeja operativa

- `OperationalCasesService`

Responsabilidad:

- listar todos los casos monitoreados
- ordenar por prioridad y ultima evaluacion
- devolver detalle desde tablas propias
- registrar decision humana
- registrar resolucion final fraude/no fraude
- guardar historial de acciones

## Criterio de prioridad y estados

### Nivel de riesgo calculado

- `normal`
- `leve`
- `medio`
- `critico`
- `no_evaluable`

Mapeo actual:

- `No evaluable` -> `no_evaluable`
- score `>= 70` o `Sospechoso` -> `critico`
- score `>= 35` -> `medio`
- score `>= 20` -> `leve`
- resto -> `normal`

### Estado operativo humano

- `pendiente`
- `en_revision`
- `cerrado`

### Decision humana

- `aceptado`
- `denegado`
- `revisar`

### Confirmacion final

- `FRAUDE_CONFIRMADO = 1`
- `FRAUDE_CONFIRMADO = 0`
- `FRAUDE_CONFIRMADO = NULL`

## Endpoints nuevos

- `POST /monitoring/run`
- `GET /monitoring/status/{process}`
- `GET /monitoring/cases`
- `GET /monitoring/cases/{sinId}`
- `POST /monitoring/cases/{sinId}/decision`
- `POST /monitoring/cases/{sinId}/resolution`

La bandeja operativa ahora queda desacoplada de la tabla fuente `SINIESTROS` y se apoya en las tablas propias antifraude.

## Justificacion tecnica

### Por que `SIN_FECAUD + SIN_ID`

- `SIN_FECAUD` es el mejor proxy disponible para cambios
- `SIN_ID` resuelve empates y deja checkpoint estable
- permite detectar inserts y modificaciones con un cursor simple

### Por que orden estable

- sin orden estable no hay reanudacion deterministica
- `ORDER BY SIN_FECAUD ASC, SIN_ID ASC` permite avanzar lote a lote sin saltos arbitrarios

### Por que relectura acotada

- tolera caidas parciales
- tolera empates de fecha
- reduce riesgo por backfills o desorden temporal

### Por que upsert idempotente

- la ventana de relectura vuelve a traer casos ya vistos
- `SIN_ID` unico evita duplicados
- el reintento es seguro despues de una falla

## Estado de verificacion

Implementado en codigo:

- contrato incremental en adapter
- persistencia antifraude propia
- servicio incremental
- watermark compuesto
- endpoints de bandeja y decisiones
- inicializacion SQL de tablas e indice recomendado

Pendiente de verificacion runtime:

- build completo del proyecto
- ejecucion de la inicializacion sobre SQL Server
- corrida incremental extremo a extremo

Bloqueos encontrados durante este sprint:

- `dotnet build` no pudo completar restore por falta de acceso a `nuget.org`
- la base `VM2016MACRODI / iSol_Macro_NET_Fase2` dejo de responder durante la validacion final de conectividad

## Proximo paso recomendado

1. Restaurar conectividad al SQL Server de desarrollo.
2. Ejecutar la API y dejar correr `AntifraudInfrastructureService`.
3. Disparar `POST /monitoring/run` con lote chico.
4. Validar que `AF_MONITORED_CASES` se llene sin duplicados por `SIN_ID`.
5. Validar la bandeja operativa y el registro de decisiones.
