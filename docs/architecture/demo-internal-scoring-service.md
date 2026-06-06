# Demo Internal Scoring Service

## Objetivo

Encapsular el modelo demo de scoring como un servicio interno consumible por el backend, sin exponer dependencias externas ni acoplarlo al frontend.

## Componentes

- contrato de request/response:
  - `ia_fraude/modelos/demo_internal_scoring_service.py`
- predictor/model loader:
  - `ia_fraude/modelos/predictor_fraude.py`
- metadata y mapeo de features demo:
  - `ia_fraude/modelos/demo_scoring_baseline.py`
- adaptador desde dominio `Case`:
  - `ers_core/application/services/tabular_scoring_service.py`

## Contrato de entrada

`DemoScoringRequest`

- `monto_reclamado: float`
- `cantidad_siniestros_previos: int`
- `debt_ratio: float`
- `bounced_checks: int`
- `antiguedad_como_cliente_meses: int`
- `zona_de_riesgo: bool`
- `imagenes_sospechosas: bool`
- `telefono_repetido_con_otro_cliente: bool`
- `proveedor_repetido: bool`
- `historial_fraude_confirmado: bool`
- `credit_score: int`

## Contrato de salida

`DemoScoringResponse`

- `score: float`
- `risk_class: str`
- `confidence: float`
- `top_factors: list[dict]`
- `model_name: str`
- `model_version: str`
- `raw_prediction: dict`

El `raw_prediction` mantiene el formato que ya consume el backend:

- `score`
- `riskClass`
- `confidence`
- `topFactors`
- `modelName`
- `modelVersion`

## Consumo desde backend

El backend no debe llamar al predictor directamente. Debe consumir:

- `DemoInternalScoringService.predict(request)`

El flujo recomendado actual es:

1. `TabularScoringService.build_features(case)`
2. `TabularScoringService.build_request(features)`
3. `DemoInternalScoringService.predict(request)`
4. `TabularScoringService.score_case(case)`

## Manejo de errores

- `DemoInternalScoringService` valida features numericas antes de inferir.
- si la prediccion falla o llega incompleta, levanta `DemoScoringServiceError`
- `TabularScoringService` captura ese error y cae al predictor heuristico local para no romper la demo

## Principios de integracion

- sin dependencias externas
- sin acoplamiento con frontend
- sin capa de red adicional
- serializacion simple mediante artefacto local del modelo
- fallback local para robustez demo

## Validacion minima

- tests unitarios del contrato y fallback:
  - `tests/test_unit_demo_internal_scoring_service.py`
- smoke end-to-end:
  - `ia_fraude/smoke_case_pipeline.py`
