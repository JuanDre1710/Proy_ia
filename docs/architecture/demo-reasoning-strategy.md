# Demo Reasoning Strategy

## Objetivo

Proveer una primera etapa de reasoning contextual para la demo, sin LLM productivo ni dependencias externas, manteniendo un contrato estructurado util para dashboard y reemplazable a futuro.

## Componentes

- motor demo reemplazable:
  - `ers_core/application/services/demo_reasoning_engine.py`
- servicio de aplicacion:
  - `ers_core/application/services/reasoning_service.py`
- integracion con pipeline:
  - `ers_core/application/services/case_pipeline_service.py`
- salida API:
  - `ia_fraude/api/case_schemas.py`
  - `ia_fraude/api/case_routes.py`

## Entrada de reasoning demo

El motor demo consume senales ya canonicas del caso:

- findings de hard rules
- alerts del caso
- evidencia consolidada
- inconsistencias de identidad
- estados de providers demo
- warnings de enrichment
- variables financieras y laborales ya normalizadas

No consume:

- payloads crudos externos
- datos inventados fuera del caso
- prompts o razonamiento LLM

## Salida estructurada

Se genera y persiste:

- `reasoningSummary`
- `summary`
- `hypothesis`
- `evidenceForReview`
- `evidenceAgainstFraud`
- `inconsistencies`
- `missingEvidence`
- `suggestedPriority`
- `suggestedNextChecks`
- `confidence`
- `unresolvedQuestions`

`reasoningSummary` y `summary` se mantienen alineados para no romper el frontend actual.

## Criterio demo

El motor demo:

- agrega senales de revision desde alerts y evidencia relevante
- agrega atenuantes cuando hay identidad verificada o menor tension financiera
- marca `missingEvidence` cuando hay respuestas parciales, timeouts o campos laborales faltantes
- calcula `suggestedPriority` en `LOW`, `MEDIUM` o `HIGH`
- deja metadata indicando que es reemplazable por un razonador futuro

## Reemplazo futuro por LLM

El punto de reemplazo es:

- `DemoReasoningEngine.generate(...)`

Cuando exista un LLM real:

1. se conserva `ReasoningService`
2. se reemplaza el motor demo por un engine nuevo
3. se conserva el contrato estructurado de salida
4. no se modifica el pipeline
5. no se modifica el frontend

## Validacion

- `venv\Scripts\python.exe -m unittest tests.test_unit_reasoning_service -v`
- `venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py`
