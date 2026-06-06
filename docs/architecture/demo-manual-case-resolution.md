# Demo Manual Case Resolution

## Objetivo
Persistir la resolucion manual del caso dentro de la demo para cerrar el flujo operativo desde frontend hasta backend.

## Comportamiento implementado
- El endpoint `POST /cases/{caseId}/decision` acepta:
  - `accept`
  - `deny`
  - `escalate`
- El comentario es obligatorio a nivel de contrato y de servicio.
- Cada decision se persiste en el repositorio de casos.
- El caso mantiene:
  - `latest_decision`
  - `decision_history`
  - metadatos de workflow (`workflowStatus`, `manualDecisionHistoryCount`, `caseClosed`)

## Persistencia
- Fuente demo:
  - `cases.json`
- La resolucion ya no queda solo en memoria.
- Si se registra una nueva decision, se conserva la anterior en `decision_history` y la nueva decision referencia a la previa mediante `supersedesDecisionId`.

## Contrato para frontend
### `POST /cases/{caseId}/decision`
- Devuelve:
  - datos de la ultima decision
  - `workflowStatus`
- Mantiene compatibilidad con el frontend actual porque sigue retornando los campos de decision ya consumidos por la UI.

### `GET /cases/{caseId}`
- Devuelve:
  - `decision`
  - `decisionHistory`

## Estado de workflow demo
- `resolved_accepted`
- `resolved_denied`
- `escalated_for_review`

## Limites actuales
- El historial queda persistido solo en almacenamiento de archivos demo.
- No hay versionado fuerte ni lock transaccional.
- La auditoria detallada sigue separada en `audit_logs.jsonl`, lista para endurecimiento futuro.
