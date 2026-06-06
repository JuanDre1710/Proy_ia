# Demo Audit Strategy

## Objetivo
Dar trazabilidad funcional de la demo para mostrar que paso con cada caso sin implementar aun una auditoria productiva completa.

## Cobertura demo
La auditoria registra como minimo estos hitos:
- `CASE_CREATED`
- `CASE_VALIDATED`
- `INTEGRATION_CONSUMED`
- `HARD_RULES_EXECUTED`
- `REASONING_EXECUTED`
- `SCORING_EXECUTED`
- `FINAL_ASSESSMENT_GENERATED`
- `CASE_DECISION_RECORDED`
- `EXPORT_REQUESTED`

## Consulta disponible
### Lista de auditoria
- `GET /audit/logs`
- Compatible con la pantalla de auditoria existente del frontend.
- Mantiene filtros y paginacion demo.

### Timeline por caso
- `GET /audit/cases/{caseId}/timeline`
- Devuelve la secuencia cronologica de eventos del caso con:
  - fecha
  - etapa
  - codigo de evento
  - resultado
  - actor
  - detalle
  - metadata

## Persistencia demo
- Repositorio: `audit_logs.jsonl`
- Cada evento queda append-only en archivo.
- Se conserva suficiente metadata para explicar el flujo del caso.

## Lo que cubre para demo
- Visibilidad de pipeline y decisiones.
- Trazabilidad por caso.
- Consumo simple desde frontend y QA.

## Lo que queda para produccion
- firma e inmutabilidad fuerte
- correlacion distribuida formal
- almacenamiento transaccional o WORM
- retencion, gobernanza y exportacion regulada
- enriquecimiento de actor, IP y device fingerprint robustos
