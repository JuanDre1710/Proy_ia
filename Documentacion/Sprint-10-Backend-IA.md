# Sprint 10 - Backend IA

## Dirigido a
Fusion final de resultados del pipeline y resolucion operativa real del caso.

## Objetivo del sprint
Implementar la evaluacion final operativa del caso a partir de reglas duras, reasoning, scoring y calidad de evidencia, y conectar la decision manual real del dashboard con persistencia auditable en backend.

## Alcance implementado

### Fusion final del pipeline

Se implemento `FinalAssessmentBuilder` para combinar:

- hard alerts y hard rules
- resultado de reasoning
- score result
- estado del pipeline
- calidad de evidencia consolidada

La salida final persistida ahora incluye como minimo:

- `finalStatus`
- `finalPriority`
- `recommendedAction`
- `confidence`
- `summaryForAnalyst`

Tambien se persisten:

- `risk_category`
- `blocked_by_hard_rules`
- `hard_rule_reasons`
- `evidence_quality`
- `pipeline_state`

### Integracion al pipeline

La evaluacion final se genera despues de scoring y del enriquecimiento adicional del caso, quedando guardada en `final_assessment` dentro del expediente.

Estados contemplados:

- `EXCLUDED`
- `NOT_EVALUABLE`
- `REVIEW_REQUIRED`
- `READY_FOR_DECISION`

### Decision manual real

Se implemento:

- `POST /cases/{caseId}/decision`

Acciones soportadas:

- `accept`
- `deny`
- `escalate`

La API exige:

- comentario obligatorio
- actor que decide
- trazabilidad de fecha y supersesion de decision previa

Se persisten:

- `latest_decision`
- comentario
- actor id
- actor name
- actor role
- timestamp

Y tambien se deja auditoria con `CASE_DECISION_RECORDED`.

### Frontend

Se conecto el dashboard actual para consumir datos reales sin redisenar la UI:

- `CaseDecisionCard` ahora usa recomendacion operativa real
- la decision manual se envia al backend con comentario obligatorio
- el detalle del caso muestra resolucion persistida
- el dashboard usa `finalAssessment` real para habilitar decision

## Estructura impactada

```text
Documentacion/
  Sprint-10-Backend-IA.md
  Sprint-11-Backend-IA.md
ers_core/
  domain/
    models.py
  application/
    services/
      case_pipeline_service.py
      final_assessment_builder.py
      case_decision_service.py
  adapters/
    repositories/
      file_case_repository.py
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
        CaseDashboardPage.tsx
        components/
          CaseDecisionCard.tsx
```

## Decisiones tecnicas

- La recomendacion operativa sigue siendo automatica pero no reemplaza la decision humana.
- La decision manual se guarda separada de `final_assessment` para mantener trazabilidad entre recomendacion y accion humana.
- El comentario del decisor es obligatorio para que toda accion quede auditable.
- La UI consume solo datos estructurados del backend.
- Se corrigio la numeracion documental dejando relaciones en `Sprint-11`.

## Que deberias poder notar ahora

### En backend

En casos terminados del pipeline deberias ver:

- `final_assessment`
- `final_assessment.final_status`
- `final_assessment.recommended_action`
- `latest_decision` cuando alguien resuelve

### En frontend

En `CaseDecisionCard` deberias ver:

- recomendacion operativa real
- prioridad final
- calidad de evidencia
- comentario obligatorio antes de aceptar, denegar o escalar

### En persistencia

En `data/cases.json` deberias notar:

- `final_assessment`
- `latest_decision`
- metadata de decision manual

## Como probarlo manualmente

### Evaluacion final

1. Evaluar un caso valido que llegue a `scored`
2. Abrir el dashboard del caso

Resultado esperado:

- aparece resumen final operativo
- el card de decision queda habilitado
- la recomendacion coincide con el estado final del backend

### Resolucion manual

1. Escribir un comentario en `CaseDecisionCard`
2. Ejecutar `Aceptar`, `Denegar` o `Escalar`
3. Recargar el detalle del caso

Resultado esperado:

- la decision sigue visible tras recargar
- se ve quien decidio
- se conserva el comentario

## Como corroborarlo rapido

1. Ejecutar `python ia_fraude/smoke_case_pipeline.py`
2. Revisar `data/case_pipeline_smoke/cases.json`
3. Si queres, probar `POST /cases/{caseId}/decision` en `/docs`

Resultado esperado:

- `final assessment structured output`: OK
- `manual decision persisted`: OK
- el caso persiste `final_assessment` y `latest_decision`

## Validacion realizada

- `python -m compileall ers_core ia_fraude`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `npm.cmd run build` en `ers-frontend`: OK

Smoke test verificado:

- `create_case_evaluation`: OK
- `hard_rules continue_to_reasoning`: OK
- `reasoning structured output`: OK
- `scoring structured output`: OK
- `final assessment structured output`: OK
- `relationship graph structured output`: OK
- `hard_rules partial provider continue`: OK
- `hard_rules provider timeout not_evaluable`: OK
- `hard_rules policy exclusion`: OK
- `hard_rules cross-source exclusion`: OK
- `manual decision persisted`: OK

## Restricciones respetadas

- La decision humana sigue siendo final.
- Toda accion queda auditable.
- No se rompio la UX actual del caso.

## Deuda pendiente / siguiente paso

- incorporar autorizacion backend basada en token para no depender del actor enviado por el frontend
- versionar reglas de fusion final
- reflejar divergencia entre recomendacion y decision humana en paneles de auditoria
