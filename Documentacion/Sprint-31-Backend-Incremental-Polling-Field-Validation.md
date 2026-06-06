# Sprint 31 - Validacion de campo incremental para polling de SINIESTROS

## Objetivo

Determinar el mejor campo incremental de `SINIESTROS` para implementar monitoreo incremental por polling sin releer toda la tabla en cada arranque.

Se evaluaron los candidatos:

- `SIN_FECAUD`
- `SIN_FEC_CARGA`
- `SIN_FEC_OPERACION`
- `SIN_ID`

La validacion se ejecuto el `2026-04-08` contra la base de desarrollo `iSol_Macro_NET_Fase2`.

## Recomendacion

La recomendacion principal para el proximo sprint es:

- usar `SIN_FECAUD` como campo incremental principal
- usar estrategia `fecha + id` con watermark compuesto `SIN_FECAUD + SIN_ID`
- ordenar por `SIN_FECAUD ASC, SIN_ID ASC`
- persistir el ultimo watermark procesado
- aplicar una ventana de relectura acotada para mitigar backfills y fechas fuera de orden
- deduplicar aguas abajo por `SIN_ID`

Fallback operativo si se prioriza no perder inserts y se acepta no detectar updates:

- usar `SIN_ID` solo

## Resumen tecnico de candidatos

### `SIN_FECAUD`

Resultado:

- nulos: `0.0000%`
- retrocesos cronologicos en orden `SIN_ID`: `29.3217%`
- timestamps duplicados: `64.7090%`
- maximo empate en un mismo timestamp: `15439` filas
- indice existente: no

Lectura tecnica:

- es el mejor candidato para detectar cambios sobre registros ya existentes
- en `95.2894%` de las filas `SIN_FECAUD > SIN_FEC_CARGA`
- los mayores `SIN_FECAUD` pertenecen tambien a `SIN_ID` historicos, no solo a los mas nuevos
- eso indica que el campo refleja actividad posterior a la carga inicial y no solo insercion

Limitacion clave:

- no es monotono respecto de `SIN_ID`
- hay filas que quedan hasta `5003` dias por detras del maximo previo
- por lo tanto, `WHERE SIN_FECAUD > @ultimo` no da garantia completa contra backfills

### `SIN_FEC_CARGA`

Resultado:

- nulos: `0.0000%`
- retrocesos cronologicos en orden `SIN_ID`: `1.4041%`
- timestamps duplicados: `20.3073%`
- maximo empate en un mismo timestamp: `37` filas
- indice existente: no

Lectura tecnica:

- es el mejor proxy de insercion inicial
- tiene mucha mejor consistencia cronologica que `SIN_FECAUD`
- sirve razonablemente para polling de altas nuevas

Limitacion clave:

- no hay evidencia de que capture updates posteriores
- queda corto para el objetivo de detectar registros nuevos o modificados con un solo cursor
- tambien tiene backfills: hasta `2662` dias por detras del maximo previo

### `SIN_FEC_OPERACION`

Resultado:

- nulos: `34.6696%`
- retrocesos cronologicos en orden `SIN_ID`: `21.9864%`
- timestamps duplicados: `97.4163%`
- maximo empate en un mismo timestamp: `104666` filas
- indice existente: no

Lectura tecnica:

- se comporta como fecha de negocio del siniestro, no como fecha tecnica de cambio
- tiene demasiados nulos y demasiados empates
- no sirve como cursor incremental confiable

### `SIN_ID`

Resultado:

- nulos: `0.0000%`
- unicidad: `100%`
- orden estable: si
- indice existente: si, PK cluster `PK_SINIESTROS (SIN_ID)`

Lectura tecnica:

- es el mejor cursor tecnico para inserts
- da orden total estable
- tiene soporte de indice nativo

Limitacion clave:

- no detecta updates sobre filas existentes
- como estrategia unica no cumple el objetivo completo si el monitoreo debe captar modificaciones

## Validacion por criterio pedido

### Porcentaje de nulos

- `SIN_FECAUD`: `0.0000%`
- `SIN_FEC_CARGA`: `0.0000%`
- `SIN_FEC_OPERACION`: `34.6696%`
- `SIN_ID`: `0.0000%`

### Consistencia cronologica

- `SIN_ID`: consistente y estable
- `SIN_FEC_CARGA`: aceptable pero no perfecta
- `SIN_FECAUD`: util para cambios, pero muy desordenada respecto de insercion
- `SIN_FEC_OPERACION`: no apta

### Si refleja inserts

- `SIN_ID`: si
- `SIN_FEC_CARGA`: si, mejor fecha para inserts
- `SIN_FECAUD`: no de forma confiable como orden de insercion
- `SIN_FEC_OPERACION`: no

### Si refleja updates

- `SIN_FECAUD`: si, es el mejor proxy disponible
- `SIN_FEC_CARGA`: no hay evidencia fuerte de updates
- `SIN_FEC_OPERACION`: no
- `SIN_ID`: no

### Si puede usarse con orden estable

- `SIN_ID`: si
- `SIN_FEC_CARGA`: solo con `SIN_ID` como desempate
- `SIN_FECAUD`: solo con `SIN_ID` como desempate
- `SIN_FEC_OPERACION`: no conviene

## Estrategia incremental inicial propuesta

### Estrategia elegida

Usar `fecha + id`:

- watermark compuesto: `(@LastSinFecAud, @LastSinId)`
- orden de extraccion: `ORDER BY SIN_FECAUD ASC, SIN_ID ASC`
- cursor tecnico persistido al finalizar cada corrida

Patron de query recomendado:

```sql
SELECT
    sin.SIN_ID,
    sin.SIN_FECAUD,
    sin.SIN_FEC_CARGA,
    sin.SIN_FEC_OPERACION,
    sin.PSI_ID
FROM dbo.SINIESTROS sin
WHERE sin.SIN_FECAUD >= DATEADD(day, -@LookbackDays, @LastSinFecAud)
ORDER BY sin.SIN_FECAUD ASC, sin.SIN_ID ASC;
```

Regla operativa:

- releer solo una ventana reciente, no toda la tabla
- aplicar upsert idempotente por `SIN_ID`
- avanzar el watermark al maximo tuple realmente procesado
- descartar como ya procesadas las filas cuyo tuple `SIN_FECAUD + SIN_ID` quede por detras del watermark persistido

### Por que no se recomienda `solo fecha`

- `SIN_FECAUD` y `SIN_FEC_CARGA` tienen empates
- `SIN_FECAUD` tiene mucho desorden cronologico
- solo fecha no ofrece orden total estable ni checkpoint deterministico

### Por que no se recomienda `solo id` como estrategia principal

- sirve muy bien para altas nuevas
- no captura modificaciones sobre siniestros ya existentes
- quedaria corto para el objetivo del monitoreo incremental pedido

## Indices

Indice actual detectado:

- `PK_SINIESTROS` cluster sobre `SIN_ID`

Recomendacion:

- crear indice no cluster sobre `(SIN_FECAUD, SIN_ID)`

DDL sugerido:

```sql
CREATE NONCLUSTERED INDEX IX_SINIESTROS_SIN_FECAUD_SIN_ID
ON dbo.SINIESTROS (SIN_FECAUD ASC, SIN_ID ASC);
```

Si la query incremental del proximo sprint necesita evitar lookups, evaluar `INCLUDE` con las columnas realmente leidas por el proceso de polling.

## Ventajas de la estrategia elegida

- permite captar inserts y tambien cambios tardios sobre siniestros ya existentes
- evita releer toda la tabla en cada arranque
- `SIN_ID` resuelve empates y deja un orden deterministico
- deja un contrato simple para el siguiente sprint: watermark compuesto + upsert por `SIN_ID`

## Riesgos y limitaciones

1. `SIN_FECAUD` no es monotono. Hay backfills reales y masivos.
2. Sin `CDC` o `Change Tracking`, ninguna estrategia basada solo en columnas de la fila garantiza detectar el `100%` de updates historicos backdateados.
3. La ventana de relectura reduce riesgo, pero no elimina por completo cambios con fecha muy antigua.
4. Sin indice sobre `SIN_FECAUD`, el polling puede degradarse a medida que crezca la tabla.
5. Si el objetivo operativo cambia a "cero perdida de inserts" por encima de updates, el fallback mas seguro es `SIN_ID`.

## Resultado listo para el proximo sprint

Queda definido para implementar el monitoreo incremental inicial:

- campo incremental principal: `SIN_FECAUD`
- desempate estable: `SIN_ID`
- estrategia inicial: polling incremental por `fecha + id`
- mejora recomendada de performance: indice `IX_SINIESTROS_SIN_FECAUD_SIN_ID`
- fallback operativo: `SIN_ID` solo si se decide priorizar inserts sobre updates

En este sprint no se implementa todavia:

- `CDC`
- `Change Tracking`
- triggers de auditoria
