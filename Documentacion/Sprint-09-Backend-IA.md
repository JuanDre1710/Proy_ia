# Sprint 09 - Backend IA

## Dirigido a
Scoring tabular del caso despues de ingesta, normalizacion, reglas duras y reasoning.

## Objetivo del sprint
Implementar el scoring tabular sobre datos depurados y estructurados del caso, ejecutandolo solo despues de pasar por reglas duras y reasoning, y devolviendo una salida cuantitativa estructurada consumible por la UI actual.

## Alcance implementado

### Servicio de scoring

Se implemento un servicio de scoring tabular en Python con:

- `POST /predict`
- `GET /model/info`

El servicio expone:

- `score`
- `riskClass`
- `topFactors`
- `confidence`
- `modelVersion`

### Contrato de features

Se definio `ScoringFeatures` como contrato de entrada estructurado para el score, usando solo datos normalizados del caso:

- frecuencia de siniestros previos
- deuda y cheques rechazados
- antiguedad
- flags de riesgo del pipeline
- indicadores de calidad/completitud

No consume payloads crudos externos.

### Integracion al backend principal

El pipeline principal ahora:

1. consolida evidencia
2. aplica reglas duras
3. ejecuta reasoning
4. si el caso sigue habilitado, ejecuta scoring
5. persiste `ScoreResult`

No se ejecuta scoring en:

- `excluded`
- `not_evaluable`

### Persistencia

Se persisten:

- score numerico
- clase de riesgo
- confianza
- `modelVersion`
- `modelName`
- factores principales estructurados
- contribuciones por feature

### Frontend

Se conecto el frontend existente para usar score y factores reales:

- `RiskScoreCard`
- panel explicativo existente

El score ya no depende de texto libre como explicacion principal; usa factores estructurados.

## Estructura impactada

```text
Documentacion/
  Sprint-09-Backend-IA.md
ers_core/
  domain/
    models.py
  application/
    dto/
      api_models.py
    mappers/
      domain_to_api.py
    services/
      case_pipeline_service.py
      tabular_scoring_service.py
  adapters/
    repositories/
      file_case_repository.py
ia_fraude/
  api/
    case_routes.py
    case_schemas.py
    scoring_routes.py
    scoring_schemas.py
  modelos/
    predictor_fraude.py
  app.py
  smoke_case_pipeline.py
ers-frontend/
  src/
    services/
      caseService.ts
```

## Decisiones tecnicas

- El scoring se ejecuta solo para casos que superaron reglas y reasoning.
- `topFactors` se expone de forma estructurada, no como texto ambiguo.
- Se reutiliza el modelo River existente cuando el entorno puede cargarlo.
- Se dejo fallback heuristico controlado para mantener verificabilidad cuando faltan dependencias del modelo en este entorno.
- El frontend consume score y factores via DTO normalizado del backend.

## Que deberias poder notar ahora

### En backend

Para un caso sano del pipeline:

- el estado final pasa a `scored`
- aparece `score_result`
- `pipelineStage = scoring`

### En frontend

Deberias ver:

- score real distinto de cero
- categoria de riesgo real
- factores principales reales en el panel explicativo

### En persistencia

En `data/cases.json` deberias notar:

- `score_result.score_value`
- `score_result.risk_category`
- `score_result.confidence`
- `score_result.model_version`
- `score_result.top_factors`
- `score_result.feature_contributions`

## Como probarlo manualmente

### Flujo exitoso

1. Tener activos `IDENTITY` y `FINANCIAL`
2. Evaluar un identificador valido que no quede excluido ni no evaluable
3. Abrir el dashboard del caso

Resultado esperado:

- el caso termina en `scored`
- el score se muestra en `RiskScoreCard`
- el panel explicativo muestra factores del modelo

### Flujo bloqueado por reglas

1. Probar un caso excluido por politica o inconsistencia
2. Probar un caso `not_evaluable` por timeout del proveedor critico

Resultado esperado:

- no aparece `score_result`
- el pipeline no ejecuta scoring

### Endpoints de scoring

1. Probar `GET /model/info`
2. Probar `POST /predict` con un payload valido de features

Resultado esperado:

- se devuelve metadata del modelo
- se devuelve score estructurado con factores

## Como corroborarlo rapido

1. Ejecutar `python ia_fraude/smoke_case_pipeline.py`
2. Revisar `data/case_pipeline_smoke/cases.json`
3. Si queres validar el servicio aislado, abrir `/docs` y probar `GET /model/info` y `POST /predict`

Resultado esperado:

- casos habilitados terminan en `scored`
- casos bloqueados no tienen score
- el score persistido incluye version y factores

## Validacion realizada

- `python -m compileall ers_core ia_fraude`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `npm.cmd run build` en `ers-frontend`: OK

Smoke test verificado:

- `create_case_evaluation`: OK
- `hard_rules continue_to_reasoning`: OK
- `reasoning structured output`: OK
- `scoring structured output`: OK
- `hard_rules partial provider continue`: OK
- `hard_rules provider timeout not_evaluable`: OK
- `hard_rules policy exclusion`: OK
- `hard_rules cross-source exclusion`: OK

## Restricciones respetadas

- No se ejecuta scoring si reglas duras excluyeron el caso.
- La explicacion principal del score es estructurada.
- El score se calcula sobre features depuradas y estructuradas.

## Deuda pendiente / siguiente paso

- reemplazar fallback heuristico por ejecucion obligatoria del modelo River en todos los entornos
- calibrar mejor confianza y factores por feature
- conectar metadata del modelo al panel administrativo o auditoria
- agregar trazabilidad de request/response del servicio de scoring en auditoria
