# Sprint 08 - Backend IA

## Dirigido a
Razonamiento contextual del pipeline usando solo datos normalizados y alertas ya calculadas.

## Objetivo del sprint
Implementar la etapa de reasoning despues de reglas duras y antes de scoring, produciendo una salida estructurada, auditable y persistida a partir del caso normalizado, sin usar payloads crudos externos ni tomar la decision final.

## Alcance implementado

### Contrato del reasoning

Se diseño un contrato estructurado para el resultado del razonamiento dentro de `ReasoningResult`, incluyendo:

- `reasoningSummary`
- `evidenceForReview`
- `evidenceAgainstFraud`
- `inconsistencies`
- `missingEvidence`
- `suggestedPriority`
- `suggestedNextChecks`

Ademas se mantienen:

- `summary`
- `hypothesis`
- `confidence`
- `supportingEvidenceIds`
- `unresolvedQuestions`

### Servicio desacoplado

Se implemento `ReasoningService` desacoplado del adapter de proveedores.

El servicio consume solo:

- datos normalizados del caso
- `ConsolidatedEvidence`
- alertas ya calculadas
- resultado de reglas duras
- metadata del caso

No consume XML/JSON crudo externo.

### Integracion al pipeline

El pipeline ahora:

1. consolida evidencia
2. ejecuta reglas duras
3. si el caso queda en `ready_for_reasoning`, ejecuta reasoning
4. persiste el `ReasoningResult`

No toma decision final ni dispara scoring en este sprint.

### Frontend

Se adapto el panel de explicacion existente para mostrar analisis contextual real:

- resumen razonado
- evidencias para revisar
- evidencias en contra de fraude
- inconsistencias
- faltantes
- prioridad sugerida
- siguientes chequeos sugeridos

Sin rediseñar la pagina.

## Estructura impactada

```text
Documentacion/
  Sprint-08-Backend-IA.md
ers_core/
  domain/
    models.py
  adapters/
    repositories/
      file_case_repository.py
  application/
    services/
      case_pipeline_service.py
      reasoning_service.py
ia_fraude/
  api/
    case_routes.py
    case_schemas.py
  smoke_case_pipeline.py
ers-frontend/
  src/
    models/
      cases.ts
    services/
      caseService.ts
    features/
      cases/
        components/
          AIExplanationPanel.tsx
```

## Decisiones tecnicas

- El reasoning solo corre para casos en `ready_for_reasoning`.
- El razonador no decide ni bloquea por si mismo.
- La salida es estructurada, no texto libre ambiguo.
- Los faltantes se derivan de warnings, parcialidad del enrichment y huecos de datos normalizados.
- La prioridad sugerida se infiere de alertas e inconsistencias ya persistidas.
- Los mocks frontend se mantuvieron compatibles dejando campos nuevos opcionales del lado UI, pero el backend real los completa.

## Que deberias poder notar ahora

### En backend

Para un caso que supera reglas duras:

- aparece `reasoning_result`
- el `pipelineStage` pasa a `reasoning`
- `metadata.analystSummary` refleja el resumen razonado

### En frontend

En el panel de analisis deberias ver:

- prioridad sugerida
- resumen contextual
- lista de evidencias para revisar
- lista de evidencias atenuantes
- inconsistencias detectadas
- faltantes
- sugerencias operativas siguientes

### En persistencia

En `data/cases.json` deberias notar que `reasoning_result` ahora incluye:

- `evidence_for_review`
- `evidence_against_fraud`
- `inconsistencies`
- `missing_evidence`
- `suggested_priority`
- `suggested_next_checks`

## Como probarlo manualmente

### Caso con reasoning ejecutado

1. Tener integraciones activas `IDENTITY` y `FINANCIAL`
2. Evaluar un identificador valido que no quede excluido ni no evaluable
3. Abrir el dashboard del caso

Resultado esperado:

- estado `ready_for_reasoning`
- `GET /cases/{caseId}` incluye `reasoning`
- el panel muestra analisis contextual real

### Caso excluido o no evaluable

1. Probar un caso bloqueado por politica o con timeout de proveedor critico

Resultado esperado:

- no se genera `reasoning_result`
- el panel sigue mostrando contexto base, pero no analisis razonado persistido

## Como corroborarlo rapido

1. Ejecutar `python ia_fraude/smoke_case_pipeline.py`
2. Revisar `data/case_pipeline_smoke/cases.json`
3. Abrir un caso `ready_for_reasoning` en frontend

Resultado esperado:

- casos listos para reasoning: OK
- `reasoning_result` persistido: OK
- casos excluidos/no evaluables sin reasoning: OK

## Validacion realizada

- `python -m compileall ers_core ia_fraude`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `npm.cmd run build` en `ers-frontend`: OK

Smoke test verificado:

- `create_case_evaluation`: OK
- `hard_rules continue_to_reasoning`: OK
- `reasoning structured output`: OK
- `hard_rules partial provider continue`: OK
- `hard_rules provider timeout not_evaluable`: OK
- `hard_rules policy exclusion`: OK
- `hard_rules cross-source exclusion`: OK
- persistencia posterior con `get_case`: OK

## Restricciones respetadas

- El razonador no decide solo.
- No inventa datos fuera del caso normalizado.
- Usa solo informacion normalizada, evidencia consolidada y reglas ya calculadas.
- No ejecuta scoring en este sprint.

## Deuda pendiente / siguiente paso

- usar el reasoning como entrada inmediata del scoring
- calibrar mejor prioridad y checks sugeridos por tipo de alerta
- agregar trazabilidad mas fina entre hallazgos y evidencias contradictorias
- conectar exportaciones y auditoria al reasoning estructurado
