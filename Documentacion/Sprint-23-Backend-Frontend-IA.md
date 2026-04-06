# Sprint 23 - Analisis en Dos Instancias y Carga JSON

## Objetivo

Preparar una primera implementacion funcional del enfoque de analisis en dos instancias:

- instancia 1 con datos internos del siniestro
- instancia 2 reservada para enrichment condicional futuro

Ademas, agregar una pantalla del frontend para subir un `.txt` o `.json` y disparar el pipeline desde la UI.

## Cambios realizados

### Backend

- Nuevo servicio `InternalCaseAnalysisService`.
- Nuevo endpoint `POST /cases/evaluate/internal-json`.
- Mapeo del JSON cargado al modelo canonico `Case`.
- Persistencia real del caso generado.
- Ejecucion de reglas, reasoning, scoring, relaciones y final assessment sobre la instancia 1.
- Trazabilidad de auditoria especifica para `instance_1_internal`.

### Frontend

- Nueva pantalla `Carga JSON`.
- Soporte para subir archivo `.txt` o `.json`.
- Parseo del contenido y envio al backend demo.
- Redireccion al dashboard del caso persistido.
- Correccion del banner de sesion mock para no mostrarlo cuando la sesion es real.

## Archivos principales

- `ers_core/application/services/internal_case_analysis_service.py`
- `ia_fraude/api/case_routes.py`
- `ia_fraude/api/case_schemas.py`
- `ers-frontend/src/features/cases/InternalCaseUploadPage.tsx`
- `ers-frontend/src/services/caseService.ts`
- `docs/architecture/two-stage-demo-analysis.md`
- `docs/demo/internal-case-upload-sample.txt`

## Limitaciones demo

- La instancia 2 aun no dispara enrichment real.
- El JSON cargado sigue siendo una simulacion del sistema core legacy.
- El reasoning sigue siendo demo y reemplazable por un motor mas avanzado en etapas futuras.
