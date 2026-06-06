# Sprint 05 - Backend IA

## Dirigido a
Enrichment, scoring y lectura consolidada del caso del sistema ERS.

## Objetivo del sprint
Completar el primer pipeline util del caso luego de la ingesta, enriqueciendo informacion base, ejecutando scoring antifraude y exponiendo un `GET /cases/{caseId}` capaz de alimentar el dashboard real sin romper el fallback actual del frontend.

## Alcance implementado

### Backend

Se agrego una orquestacion nueva del pipeline del caso para:

- verificar disponibilidad minima de integraciones requeridas:
  - `IDENTITY`
  - `FINANCIAL`
- enriquecer datos del sujeto
- consolidar estado de identidad
- completar perfil financiero
- completar perfil laboral/fiscal sintetico
- generar evidencias y alertas canonicas
- ejecutar score usando el modelo River existente cuando esta disponible
- usar fallback heuristico si el modelo no puede cargarse
- construir razonamiento y evaluacion final del caso
- persistir el caso enriquecido completo

Se agrego un nuevo estado de procesamiento:

- `scored`

### API de casos

Se mantuvieron los endpoints:

- `POST /cases/evaluate`
- `GET /cases/{caseId}`

Pero ahora:

- `POST /cases/evaluate` puede devolver el caso ya scoreado si las integraciones requeridas estan activas
- `GET /cases/{caseId}` devuelve informacion rica del caso:
  - sujeto
  - datos financieros
  - datos laborales/fiscales
  - alertas
  - score
  - razonamiento

### Frontend

Se ajusto el adapter del frontend para:

- interpretar el nuevo estado `scored`
- consumir el caso enriquecido real desde `GET /cases/{caseId}`
- seguir usando placeholder y mocks cuando el backend no responde o el caso aun no esta scoreado

## Estructura impactada

```text
Documentacion/
  Sprint-05-Backend-IA.md
ers_core/
  domain/
    enums.py
  adapters/
    repositories/
      file_case_repository.py
  application/
    services/
      case_ingestion_service.py
      case_pipeline_service.py
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

- Se mantuvo `Case` como centro canonico del pipeline y no se expuso payload crudo de proveedores.
- El enrichment de este sprint usa adapters/control local para que el flujo sea verificable sin depender de APIs externas reales.
- El scoring intenta reutilizar el modelo River existente del repo y degrada a heuristica solo si el modelo no esta disponible.
- Se exigio presencia de integraciones activas `IDENTITY` y `FINANCIAL` para pasar de ingesta a scoring.
- Se amplio la persistencia del caso para no perder `financial_info`, `alerts`, `reasoning_result`, `score_result` y `final_assessment`.
- El frontend no cambio de UX; solo mejoro el adapter de datos.

## Que deberias poder notar ahora

### En busqueda

Si existen integraciones activas `IDENTITY` y `FINANCIAL`:

- al evaluar un identificador valido, el caso puede quedar directamente en `scored`
- la busqueda lo considera un caso abrible

Si falta alguna integracion requerida:

- el caso queda en `waiting_for_enrichment`

### En el dashboard

Para un caso `scored` deberias ver:

- nombre y datos basicos reales del sujeto
- score distinto de cero
- categoria de riesgo real
- alertas reales del pipeline
- explicacion y factores principales
- datos financieros y laborales/fiscales completos

### En archivos

Deberias notar en `data/cases.json`:

- campos nuevos persistidos para el caso completo
- `pipelineStage = scored_assessment`
- metadata de enrichment y scoring

## Como probarlo manualmente

### Flujo completo

1. Crear o habilitar una integracion activa `IDENTITY`
2. Crear o habilitar una integracion activa `FINANCIAL`
3. Levantar backend
4. Levantar frontend
5. Iniciar sesion
6. Buscar un identificador valido
7. Abrir el dashboard del caso

Resultado esperado:

- `POST /cases/evaluate` devuelve `status = scored`
- `GET /cases/{caseId}` devuelve score, reasoning y alertas
- el dashboard muestra datos reales del caso y no solo placeholder

### Flujo con integraciones faltantes

1. Deshabilitar una de las integraciones requeridas
2. Evaluar un identificador valido

Resultado esperado:

- el caso queda en `waiting_for_enrichment`
- el dashboard conserva el comportamiento placeholder

## Como corroborarlo rapido

1. Ejecutar `python ia_fraude/smoke_case_pipeline.py`
2. Revisar `data/case_pipeline_smoke/cases.json`
3. Revisar `data/case_pipeline_smoke/audit_logs.jsonl`
4. Si queres validar UI, ejecutar tambien el frontend y abrir un caso con integraciones activas

Resultado esperado:

- el smoke crea casos scoreados
- el caso persistido conserva score, reasoning y alertas
- la auditoria registra la finalizacion del pipeline

## Validacion realizada

- `python -m compileall ers_core ia_fraude`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `npm.cmd run build` en `ers-frontend`: OK

Smoke test verificado:

- `create_case_evaluation`: OK
- `enrich_and_score_case`: OK
- `score=34.0`: OK
- `risk_category=REQUIRES_REVIEW`: OK
- persistencia completa con `get_case`: OK

## Restricciones respetadas

- No se consumieron payloads externos crudos en dominio ni frontend.
- No se removio el fallback a mocks del frontend.
- No se cambio la UX del dashboard ni de la busqueda.
- Se mantuvo persistencia simple en archivo para continuar el avance incremental.

## Deuda pendiente / siguiente paso

- reemplazar enrichment local por adapters reales por proveedor
- incorporar relaciones y documentos como fuentes del pipeline
- registrar resolucion manual del caso contra backend con auditoria real
- exponer auditoria consultable de casos y acciones de score
- reemplazar persistencia en archivo por almacenamiento real
