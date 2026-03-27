# Sprint 15 - Backend IA

## Dirigido a
Entrenamiento baseline de scoring antifraude para la demo end-to-end.

## Objetivo del sprint

Entrenar y dejar integrado un modelo tabular baseline usando exclusivamente el dataset demo preparado, con artefacto reutilizable por el backend actual.

## Alcance implementado

### Modelo baseline entrenado

Se entreno un baseline tabular con:

- `StandardScaler`
- `LogisticRegression`
- balanceo por `class_weight`

El target principal definido fue:

- `fraude`

### Alineacion con el pipeline actual

Se alineo el entrenamiento con el payload real que construye `TabularScoringService`.

Features usadas por el backend y por el modelo:

- `monto_reclamado`
- `cantidad_siniestros_previos`
- `debt_ratio`
- `bounced_checks`
- `antiguedad_como_cliente_meses`
- `zona_de_riesgo`
- `imagenes_sospechosas`
- `telefono_repetido_con_otro_cliente`
- `proveedor_repetido`
- `historial_fraude_confirmado`
- `credit_score`

### Integracion de inferencia

Se actualizo el predictor para:

- preferir el nuevo artefacto demo `modelo_fraude_demo_tabular.pkl`
- mantener fallback al artefacto legacy si el nuevo no estuviera disponible
- devolver salida estructurada con:
  - score
  - clase de riesgo
  - confianza
  - factores influyentes

### Artefactos generados

- `modelo/modelo_fraude_demo_tabular.pkl`
- `modelo/modelo_fraude_demo_tabular.json`
- `data/ml/demo_scoring/dataset_demo_backend_features_train.csv`
- `data/ml/demo_scoring/dataset_demo_backend_features_validation.csv`

## Estructura impactada

```text
Documentacion/
  Sprint-15-Backend-IA.md
docs/
  ml/
    demo-tabular-baseline-training.md
data/
  ml/
    demo_scoring/
      dataset_demo_backend_features_train.csv
      dataset_demo_backend_features_validation.csv
ia_fraude/
  modelos/
    demo_scoring_baseline.py
    entrenar_modelo_demo_tabular.py
    predictor_fraude.py
ers_core/
  application/
    services/
      tabular_scoring_service.py
modelo/
  modelo_fraude_demo_tabular.pkl
  modelo_fraude_demo_tabular.json
```

## Como corroborarlo rapido

```powershell
venv\Scripts\python.exe -m ia_fraude.modelos.entrenar_modelo_demo_tabular
venv\Scripts\python.exe -m compileall ia_fraude\modelos ers_core\application\services\tabular_scoring_service.py
venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py
```

## Validacion realizada

- `venv\Scripts\python.exe -m ia_fraude.modelos.entrenar_modelo_demo_tabular`: OK
- `venv\Scripts\python.exe -m compileall ia_fraude\modelos ers_core\application\services\tabular_scoring_service.py`: OK
- `venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py`: OK

Metricas baseline observadas:

- `accuracy = 0.98`
- `precision = 0.0`
- `recall = 0.0`
- `f1 = 0.0`

## Restricciones respetadas

- Se uso solo el dataset demo preparado.
- No se integraron proveedores externos.
- No se mezclo razonamiento LLM.
- Se priorizo facilidad de integracion y estabilidad.

## Limitaciones

- El dataset demo sigue teniendo solo 3 positivos reales.
- Las metricas de clase positiva no alcanzan para un uso productivo.
- Los factores influyentes son explicabilidad ligera para demo, no interpretabilidad formal.

## Deuda pendiente

- Generar un dataset demo con mayor volumen y diversidad de positivos.
- Reentrenar con mejores senales alineadas a evidencia real del pipeline.
- Ajustar calibracion de score cuando exista una base demo menos extrema en desbalance.
