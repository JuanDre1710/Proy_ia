# Demo Tabular Baseline Training

## Objetivo

Entrenar un modelo baseline de scoring antifraude usando solo el dataset demo preparado y dejarlo reutilizable por el backend actual para la demo end-to-end.

## Target principal

- `fraude`

## Payload alineado al backend

El modelo se entrena sobre el mismo payload tabular que hoy consume el scoring del pipeline:

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

## Origen de entrenamiento

- train demo: `data/ml/demo_scoring/dataset_demo_fraude_train_balanced.csv`
- validation demo: `data/ml/demo_scoring/dataset_demo_fraude_validation.csv`
- train mapeado al backend: `data/ml/demo_scoring/dataset_demo_backend_features_train.csv`
- validation mapeado al backend: `data/ml/demo_scoring/dataset_demo_backend_features_validation.csv`

## Modelo elegido

- `StandardScaler + LogisticRegression`
- `class_weight="balanced"`
- prioridad: estabilidad, serializacion simple e integracion directa

## Artefactos generados

- modelo backend: `modelo/modelo_fraude_demo_tabular.pkl`
- metadata: `modelo/modelo_fraude_demo_tabular.json`

## Contrato de salida de prediccion

La prediccion estructurada devuelve:

- `score`
- `riskClass`
- `topFactors`
- `confidence`
- `modelVersion`
- `modelName`

## Metricas observadas

- `accuracy = 0.98`
- `precision = 0.0`
- `recall = 0.0`
- `f1 = 0.0`

## Interpretacion

- El baseline funciona tecnicamente y ya alimenta el pipeline actual.
- Las metricas de clase positiva siguen siendo nulas porque el dataset demo tiene solo 3 positivos reales.
- El score sirve para demo visual, pruebas de integracion y persistencia del flujo, no para decisiones reales.

## Limitaciones

- No hay datos externos ni labels reales de produccion.
- `historial_fraude_confirmado` queda en cero en entrenamiento porque no existe una version operativa segura de esa senal en el dataset preparado.
- Los factores influyentes se calculan a partir de las contribuciones del modelo logistico y reglas de rotulado simples para facilitar explicabilidad demo.

## Ejecucion

```powershell
venv\Scripts\python.exe -m ia_fraude.modelos.entrenar_modelo_demo_tabular
venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py
```
