# Sprint 22 - Demo Final

## Dirigido a
Preparacion final de la demo integral ERS.

## Objetivo del sprint
Dejar la demo estable, clara y repetible para mostrar el flujo completo entre frontend, backend, reglas, reasoning, scoring, resolucion manual y auditoria.

## Alcance implementado
- Se fijaron escenarios demo representativos con identificadores reales del backend demo:
  - normal
  - revision
  - sospechoso
  - datos incompletos
  - inconsistencia fuerte
- Se ajustaron los ejemplos visibles en la pantalla de busqueda.
- Se agrego un script de validacion final de escenarios end-to-end.
- Se documento un runbook de ejecucion y presentacion de la demo.

## Escenarios demo consolidados
- `27123456789` -> caso normal
- `30111205` -> caso con revision
- `30111201` -> caso sospechoso
- `30111297` -> caso con datos incompletos / no evaluable
- `30111277` -> caso con inconsistencias / exclusion

## Estructura impactada
```text
Documentacion/
  Sprint-22-Demo-Final.md
docs/
  demo/
    final-demo-runbook.md
ers-frontend/
  src/
    features/
      search/
        SearchPage.tsx
ia_fraude/
  demo_final_validation.py
```

## Validacion realizada
- `venv\\Scripts\\python.exe ia_fraude\\demo_final_validation.py`
- `venv\\Scripts\\python.exe ia_fraude\\smoke_case_pipeline.py`
- `venv\\Scripts\\python.exe -m unittest tests.test_integration_audit_and_exports_api tests.test_e2e_pipeline tests.test_integration_api_hardening -v`
- `cd ers-frontend && npm.cmd run build`

## Gaps marcados para siguiente etapa
- integraciones externas reales
- auditoria fuerte productiva
- observabilidad y trazabilidad distribuida
- workflow multiusuario avanzado
- hardening del modelo y dataset productivo
