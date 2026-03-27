# Sprint 21 - Backend IA

## Dirigido a
Backend y trazabilidad operativa del sistema ERS demo.

## Objetivo del sprint
Implementar una auditoria demo funcional para mostrar que paso con cada caso a lo largo del pipeline y en la resolucion manual.

## Alcance implementado
- Nuevos eventos de auditoria para:
  - creacion del caso
  - validacion
  - evaluacion final
- Mantenimiento de eventos existentes para:
  - consumo de integraciones
  - reglas disparadas
  - reasoning ejecutado
  - scoring ejecutado
  - resolucion manual
  - exportaciones
- Consulta compatible con frontend existente:
  - `GET /audit/logs`
- Nueva timeline por caso:
  - `GET /audit/cases/{caseId}/timeline`
- Filtro backend adicional por `identificadorConsultado`.

## Estructura impactada
```text
Documentacion/
  Sprint-21-Backend-IA.md
docs/
  architecture/
    demo-audit-strategy.md
ers_core/
  adapters/
    repositories/
      file_audit_log_repository.py
  application/
    ports/
      integration_repository.py
    services/
      case_ingestion_service.py
      case_pipeline_service.py
  domain/
    enums.py
ia_fraude/
  api/
    audit_routes.py
    audit_schemas.py
tests/
  test_integration_audit_and_exports_api.py
```

## Decisiones tecnicas
- Se mantuvo `audit_logs.jsonl` como almacenamiento append-only simple para demo.
- La tabla del frontend no se rompio: los nuevos eventos se agrupan bajo la categoria visible `Consulta de riesgo`.
- La trazabilidad fina por caso se expone en una endpoint separada de timeline.

## Validacion realizada
- `venv\\Scripts\\python.exe -m unittest tests.test_integration_audit_and_exports_api tests.test_e2e_pipeline tests.test_integration_api_hardening -v`
- `venv\\Scripts\\python.exe ia_fraude\\smoke_case_pipeline.py`
- `venv\\Scripts\\python.exe -m compileall ers_core ia_fraude tests`
