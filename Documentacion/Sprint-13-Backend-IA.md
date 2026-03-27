# Sprint 13 - Backend IA

## Dirigido a
Hardening final para QA integral y salida a MVP.

## Objetivo del sprint
Endurecer el sistema existente priorizando estabilidad, seguridad, mantenibilidad y validacion integral del pipeline, sin agregar funcionalidades fuera de alcance.

## Alcance implementado

### Testing

Se agrego una suite ejecutable con `unittest`:

- unit tests
- integration tests
- E2E critico del pipeline

Cobertura agregada:

- `FinalAssessmentBuilder`
- `CaseExportService`
- `RateLimitMiddleware`
- manejo global de errores
- permisos de auditoria
- exportaciones reales
- pipeline end-to-end

### Hardening tecnico

Se incorporo:

- configuracion por ambiente con `.env`
- `create_app()` para FastAPI
- middlewares de contexto de request
- rate limiting global configurable
- handlers globales de errores
- logs estructurados JSON
- headers de observabilidad (`X-Request-Id`, `X-Process-Time-Ms`)
- watcher del modelo configurable por ambiente

### Seguridad y mantenibilidad

Se reforzo:

- validacion de secreto JWT en produccion
- control de permisos por rol en endpoints sensibles ya agregados
- desacople de paths fijos via `ERS_DATA_DIR`
- arranque lazy del predictor legacy para no romper la API si el modelo no esta disponible

### Validacion integral del pipeline

Se valido de punta a punta:

- ingesta
- normalizacion
- reglas
- reasoning
- scoring
- fusion final
- decision
- auditoria
- exportaciones

### Documentacion

Se actualizo:

- `README.md`
- `.env.example`
- `Documentacion/Runbook-QA-MVP.md`

## Estructura impactada

```text
.env.example
README.md
Documentacion/
  Runbook-QA-MVP.md
  Sprint-13-Backend-IA.md
ers_core/
  config/
    app_settings.py
ia_fraude/
  app.py
  observability.py
tests/
  support.py
  test_unit_final_assessment_builder.py
  test_unit_case_export_service.py
  test_unit_rate_limit_middleware.py
  test_integration_api_hardening.py
  test_integration_audit_and_exports_api.py
  test_e2e_pipeline.py
```

## Como corroborarlo rapido

```powershell
venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
python ia_fraude/smoke_case_pipeline.py
venv\Scripts\python.exe -m compileall ers_core ia_fraude tests
cd ers-frontend
npm.cmd run build
```

## Validacion realizada

- `venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `venv\Scripts\python.exe -m compileall ers_core ia_fraude tests`: OK
- `npm.cmd run build` en frontend: OK

## Restricciones respetadas

- No se agregaron features nuevas fuera de alcance.
- Se priorizo estabilidad, seguridad y mantenibilidad.
- No se redisenio el frontend.

## Deuda pendiente

- migrar progresivamente `datetime.utcnow()` a datetimes timezone-aware
- endurecer permisos backend de todos los endpoints administrativos legacy
- agregar monitoreo externo y alertado si el MVP sale a entornos compartidos
