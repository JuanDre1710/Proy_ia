# Sprint 11 - Backend IA

## Dirigido a
Capa de relaciones sospechosas del caso y conexion con el grafo existente del frontend.

## Objetivo del sprint
Implementar una capa relacional del caso sobre modelo interno, generar senales sospechosas entre expedientes y exponer un endpoint de grafo compatible con la visualizacion ya existente del frontend.

## Alcance implementado

### Modelo relacional

Se modelaron estructuras internas para relaciones:

- `RelationshipNode`
- `RelationshipEdge`
- `RelationshipSignal`
- `RelationshipGraph`

Estas estructuras viven en dominio y quedan persistidas dentro del caso.

### Servicio de relaciones

Se implemento `RelationshipService` para construir el grafo del caso a partir de:

- persona
- telefono
- domicilio
- empresa
- caso

Usa casos persistidos como universo de comparacion, sin acoplarse a un proveedor particular.

### Senales generadas

Se implementaron como minimo:

- coincidencia de telefono
- coincidencia de domicilio
- coincidencia de empresa
- reutilizacion sospechosa entre casos

Estas senales se transforman tambien en alertas visibles del caso cuando corresponde.

### Endpoint de graph

Se agrego:

- `GET /cases/{caseId}/graph`

La salida ya viene en formato consumible por el componente de grafo del frontend:

- `nodes`
- `edges`
- `signals`

### Frontend

Se adapto `caseService` para:

- pedir `GET /cases/{caseId}/graph`
- mapear nodos y edges al formato de `RelationshipGraphCard`
- dejar visibles las senales relacionales en el grafo existente

Sin tocar el diseno visual.

## Como corroborarlo rapido

1. Ejecutar `python ia_fraude/smoke_case_pipeline.py`
2. Revisar `data/case_pipeline_smoke/cases.json`
3. Probar `GET /cases/{caseId}/graph` en `/docs`

Resultado esperado:

- `relationship graph structured output`: OK
- el caso persiste `relationship_graph`
- el frontend recibe el grafo sin adaptaciones visuales extra

## Validacion realizada

- `python -m compileall ers_core ia_fraude`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `npm.cmd run build` en `ers-frontend`: OK
