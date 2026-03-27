# Sprint 07 - Backend IA

## Dirigido a
Reglas duras del pipeline antes de reasoning y antes de scoring.

## Objetivo del sprint
Implementar la etapa de reglas duras sobre la evidencia consolidada del caso para decidir exclusiones, bloqueos, no evaluables y continuidad a reasoning, dejando alertas explicables y auditables antes de cualquier etapa posterior.

## Alcance implementado

### Motor de reglas

Se creo `RuleEngine` para evaluar reglas duras sobre el caso ya enriquecido.

Cada regla devuelve:

- `code`
- `severity`
- `message`
- `justification`
- `evidenceRefs`
- `effectOnPipeline`

Se persiste el resultado completo en:

- `HardRuleEvaluation`
- `HardRuleFinding`

### Reglas iniciales implementadas

Se implementaron como minimo:

- persona fallecida
- datos insuficientes / no evaluable
- inconsistencia critica entre fuentes
- limite diario excedido
- proveedor critico no disponible
- bloqueo por politica

### Control del pipeline

Se agregaron estados explicitos para salida de reglas duras:

- `ready_for_reasoning`
- `not_evaluable`
- `excluded`

El pipeline ahora:

- consolida evidencia
- evalua reglas duras
- persiste alertas y estado resultante
- no ejecuta scoring en casos excluidos o no evaluables

### Alertas reales

Cada hallazgo de reglas duras se transforma en alertas reales:

- `source_type = INTERNAL_RULE`
- severidad `CRITICAL` o `WARNING`
- detalle explicable con justificacion y efecto del pipeline

Estas alertas alimentan el `AlertsPanel` existente sin cambiar el diseño visual.

## Estructura impactada

```text
Documentacion/
  Sprint-07-Backend-IA.md
ers_core/
  domain/
    enums.py
    models.py
  adapters/
    anti_corruption/
      nosis_normalizer.py
    providers/
      nosis_provider_adapter.py
    repositories/
      file_case_repository.py
  application/
    services/
      case_ingestion_service.py
      case_pipeline_service.py
      rule_engine.py
ia_fraude/
  api/
    case_routes.py
    case_schemas.py
  smoke_case_pipeline.py
ers-frontend/
  src/
    services/
      caseService.ts
      searchService.ts
```

## Decisiones tecnicas

- Las reglas duras se ejecutan despues de `ConsolidatedEvidence` y antes de reasoning/scoring.
- El motor devuelve un resultado persistible y auditable por caso.
- Las alertas visibles en UI se derivan del resultado del motor, no de payloads crudos.
- La inconsistencia critica entre fuentes compara identidad consolidada con provincia declarada por el segundo proveedor.
- El bloqueo por politica se dejo parametrizado de forma simple por identificadores stub para poder validar el flujo de exclusion en este sprint.
- `ready_for_scoring` queda preparado dentro de `HardRuleEvaluation`, pero este sprint todavia no dispara scoring.

## Que deberias poder notar ahora

### En backend

Para un caso sin bloqueos:

- el estado final pasa a `ready_for_reasoning`

Para un caso con timeout de proveedor critico o evidencia insuficiente:

- el estado final pasa a `not_evaluable`

Para un caso excluido por regla dura:

- el estado final pasa a `excluded`

### En el dashboard

Deberias ver alertas reales del motor, por ejemplo:

- bloqueo por politica
- proveedor critico no disponible
- inconsistencia critica entre fuentes
- caso no evaluable

Sin score real todavia.

### En persistencia

En `data/cases.json` deberias notar:

- `hard_rule_evaluation`
- hallazgos con `code`, `severity`, `justification` y `effect_on_pipeline`
- `alerts` con `source_type = INTERNAL_RULE`
- `pipelineStage = hard_rules`

## Como probarlo manualmente

### Caso listo para reasoning

1. Tener activos `IDENTITY` y `FINANCIAL`
2. Evaluar un identificador valido sin sufijos bloqueados

Resultado esperado:

- estado `ready_for_reasoning`
- alertas operativas, pero sin exclusion

### Caso no evaluable por proveedor critico

1. Configurar `NOSIS` con `settings.stubMode = timeout`
2. Evaluar un identificador valido

Resultado esperado:

- estado `not_evaluable`
- alerta por proveedor critico no disponible

### Caso excluido por politica

1. Evaluar un identificador que termine en `66` o `13`

Resultado esperado:

- estado `excluded`
- alerta critica por politica

### Caso excluido por inconsistencia critica

1. Evaluar un identificador que termine en `77`

Resultado esperado:

- estado `excluded`
- alerta critica por inconsistencia entre fuentes

## Como corroborarlo rapido

1. Ejecutar `python ia_fraude/smoke_case_pipeline.py`
2. Revisar `data/case_pipeline_smoke/cases.json`
3. Revisar `data/case_pipeline_smoke/audit_logs.jsonl`

Resultado esperado:

- caso `ready_for_reasoning`: OK
- caso parcial que continua: OK
- caso `not_evaluable` por timeout: OK
- caso `excluded` por politica: OK
- caso `excluded` por inconsistencia: OK

## Validacion realizada

- `python -m compileall ers_core ia_fraude`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `npm.cmd run build` en `ers-frontend`: OK

Smoke test verificado:

- `create_case_evaluation`: OK
- `hard_rules continue_to_reasoning`: OK
- `hard_rules partial provider continue`: OK
- `hard_rules provider timeout not_evaluable`: OK
- `hard_rules policy exclusion`: OK
- `hard_rules cross-source exclusion`: OK
- persistencia de hard rules con `get_case`: OK

## Restricciones respetadas

- Toda alerta queda explicable y auditable.
- No se ejecuta scoring en casos excluidos.
- No se ejecuta scoring en este sprint.
- La salida queda limpia y preparada para reasoning.

## Deuda pendiente / siguiente paso

- conectar reasoning real al estado `ready_for_reasoning`
- endurecer politicas configurables en lugar de stubs
- externalizar catalogo de reglas y severidades
- agregar reglas duras sobre documentos, relaciones y fraude historico
- enriquecer auditoria con correlacion por regla y por evidencia
