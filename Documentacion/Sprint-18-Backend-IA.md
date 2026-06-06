# Sprint 18 - Backend IA

## Dirigido a
Primera version de reasoning contextual para demo, sin LLM complejo.

## Objetivo del sprint

Construir un reasoning demo funcional, estructurado y persistible, integrado al pipeline del caso y preparado para futuro reemplazo por un motor LLM real.

## Alcance implementado

### Motor demo de reasoning

Se agrego un motor dedicado:

- `DemoReasoningEngine`

Ubicacion:

- `ers_core/application/services/demo_reasoning_engine.py`

Este motor genera una salida estructurada a partir de:

- reglas disparadas
- alerts
- inconsistencias de identidad
- evidencia demo interna
- warnings de enrichment
- estados de providers

### Integracion con pipeline

`ReasoningService` ahora:

- construye un request canonico para reasoning
- delega la generacion al motor demo
- persiste `ReasoningResult` en el caso
- marca en metadata que es `demo_internal` y reemplazable

### Salida estructurada

Se mantiene formato compatible con frontend y API actual:

- `summary`
- `reasoningSummary`
- `hypothesis`
- `evidenceForReview`
- `evidenceAgainstFraud`
- `inconsistencies`
- `missingEvidence`
- `suggestedPriority`
- `suggestedNextChecks`
- `confidence`
- `unresolvedQuestions`

### Persistencia

La salida sigue persistiendo dentro de `reasoning_result` del caso, sin cambiar el modelo de dominio.

## Estructura impactada

```text
Documentacion/
  Sprint-18-Backend-IA.md
docs/
  architecture/
    demo-reasoning-strategy.md
ers_core/
  application/
    services/
      demo_reasoning_engine.py
      reasoning_service.py
ia_fraude/
  api/
    case_routes.py
    case_schemas.py
tests/
  test_unit_reasoning_service.py
```

## Como corroborarlo rapido

```powershell
venv\Scripts\python.exe -m unittest tests.test_unit_reasoning_service -v
venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py
venv\Scripts\python.exe -m compileall ers_core ia_fraude tests
```

## Validacion realizada

- `venv\Scripts\python.exe -m unittest tests.test_unit_reasoning_service -v`: OK
- `venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py`: OK
- `venv\Scripts\python.exe -m compileall ers_core ia_fraude tests`: OK

## Restricciones respetadas

- No se incorporo LLM productivo.
- No se inventaron datos externos.
- Se mantuvo formato consistente con el frontend.
- La etapa quedo explicitamente reemplazable.

## Limitaciones

- El reasoning sigue siendo heuristico y basado en evidencia demo.
- No hay evaluacion semantica avanzada ni generacion libre controlada.
- La prioridad sugerida y la confianza son estimaciones operativas para demo.

## Deuda pendiente

- introducir un engine de reasoning mas sofisticado cuando exista contexto de negocio mas rico
- agregar pruebas adicionales sobre contratos API del bloque reasoning
- calibrar mejor prioridad y confianza con mas casos demo
