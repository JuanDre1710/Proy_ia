# Sprint 20 - Backend IA

## Dirigido a
Backend y workflow operativo del sistema ERS demo.

## Objetivo del sprint
Hacer real la resolucion manual del caso dentro de la demo, con persistencia, historial basico y contrato utilizable por el frontend actual.

## Alcance implementado
- Persistencia real de resoluciones manuales en el repositorio de casos demo.
- Soporte para acciones:
  - `accept`
  - `deny`
  - `escalate`
- Comentario obligatorio en contrato API y en servicio de dominio.
- Historial basico de decisiones por caso:
  - `decision_history`
  - `latest_decision`
- Metadatos operativos de workflow:
  - `workflowStatus`
  - `manualDecisionHistoryCount`
  - `caseClosed`
- Respuesta de API compatible con el frontend existente y enriquecida con estado de workflow.

## Estructura impactada
```text
Documentacion/
  Sprint-20-Backend-IA.md
docs/
  architecture/
    demo-manual-case-resolution.md
ers_core/
  adapters/
    repositories/
      file_case_repository.py
  application/
    services/
      case_decision_service.py
  domain/
    models.py
ia_fraude/
  api/
    case_routes.py
    case_schemas.py
tests/
  test_e2e_pipeline.py
```

## Decisiones tecnicas
- Se mantuvo el frontend actual sin rediseño.
- El historial de decisiones se persiste dentro del mismo agregado `Case` para evitar complejidad extra en la demo.
- La respuesta de decision sigue siendo compatible con la UI y agrega `workflowStatus`.
- El detalle del caso ahora expone `decisionHistory` para auditoria basica y futuras pantallas.

## Validacion realizada
- `venv\\Scripts\\python.exe -m unittest tests.test_e2e_pipeline -v`
- `venv\\Scripts\\python.exe ia_fraude\\smoke_case_pipeline.py`
- `venv\\Scripts\\python.exe -m compileall ers_core ia_fraude tests`
