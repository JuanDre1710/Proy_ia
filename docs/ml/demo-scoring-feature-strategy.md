# Demo Scoring Feature Strategy

## Objetivo

Dejar un dataset sintetico utilizable para entrenamiento y validacion baseline del score binario de fraude, sin depender de proveedores externos ni tocar el modelo activo del runtime.

## Fuente usada

- Dataset crudo: `data/ml/demo_scoring/dataset_demo_fraude_1000_raw.csv`
- Manifest tecnico: `data/ml/demo_scoring/dataset_demo_fraude_manifest.json`

## Target principal

- `fraude`
  - `0`: caso no fraudulento en la demo
  - `1`: caso fraudulento en la demo

## Features usadas en baseline

- `edad`
- `provincia`
- `antiguedad_domicilio_meses`
- `situacion_laboral`
- `antiguedad_laboral_meses`
- `ingresos_mensuales`
- `score_crediticio`
- `deuda_total`
- `cantidad_deudas`
- `cheques_rechazados`
- `tipo_siniestro`
- `frecuencia_siniestros_ultimo_anio`
- `monto_reclamado`
- `repite_domicilio`
- `repite_telefono`
- `cambio_aseguradora_frecuente`
- `denuncia_tardia`
- `siniestro_cerca_vencimiento`
- `testigo_repetido`
- `inconsistencia_ingresos_vs_deuda`
- `inconsistencia_laboral`
- `datos_incompletos`
- `mes_siniestro`
- `trimestre_siniestro`
- `dia_semana_siniestro`
- `fin_de_semana_siniestro`

## Variables auxiliares

- `case_id`: trazabilidad del caso
- `dni`: trazabilidad e identificacion del titular
- `requiere_revision`: etiqueta operativa util para analisis de pipeline demo
- `nivel_riesgo`: categoria agregada util para reporting demo

## Variables excluidas del entrenamiento

- `case_id`: identificador unico, sin capacidad de generalizacion
- `dni`: identificador sensible, no debe entrar al modelo
- `fecha_siniestro`: reemplazada por features temporales derivadas
- `requiere_revision`: variable de workflow, no target principal
- `nivel_riesgo`: fuga de informacion directa
- `cluster_fraude`: artefacto sintetico del generador demo, no disponible en inferencia realista

## Calidad minima validada

- 1000 filas y 29 columnas en origen
- 0 valores faltantes en todas las columnas
- tipado consistente:
  - categoricas: `provincia`, `situacion_laboral`, `tipo_siniestro`
  - numericas/binarias: resto de features tabulares
  - fecha parseable en formato `dd/mm/yyyy`
- labels presentes y binarios:
  - `fraude=1`: 3 casos
  - `fraude=0`: 997 casos

## Split baseline generado

- `data/ml/demo_scoring/dataset_demo_fraude_train.csv`
  - 800 filas
  - 2 positivos
  - 798 negativos
- `data/ml/demo_scoring/dataset_demo_fraude_train_balanced.csv`
  - 840 filas
  - 42 positivos
  - 798 negativos
  - positivos duplicados con reemplazo solo para entrenamiento demo
- `data/ml/demo_scoring/dataset_demo_fraude_validation.csv`
  - 200 filas
  - 1 positivo
  - 199 negativos

## Observaciones de calidad y limitaciones

- El dataset esta extremadamente desbalanceado: 0.3% de positivos reales.
- `nivel_riesgo` equivale en la practica a una transformacion del target:
  - `alto` coincide con `fraude=1`
  - `medio` coincide con `requiere_revision=1` y `fraude=0`
  - `bajo` coincide con el resto
- La accuracy aislada no sirve para evaluar este baseline. En la corrida de validacion, `precision`, `recall` y `f1` quedaron en `0.0`.
- El baseline sirve para dejar armado el circuito tecnico de preparacion, split, entrenamiento y versionado de artefactos, no para sacar conclusiones de negocio productivas.

## Scripts del sprint

- Preparacion:
  - `venv\Scripts\python.exe ia_fraude\modelos\entrenar_reentrenar\preparar_dataset_demo_scoring.py`
- Entrenamiento baseline aislado:
  - `venv\Scripts\python.exe ia_fraude\modelos\entrenar_reentrenar\entrenar_modelo_fraude_demo_baseline.py`

## Artefactos generados

- Dataset preparado: `data/ml/demo_scoring/dataset_demo_fraude_preparado.csv`
- Train raw: `data/ml/demo_scoring/dataset_demo_fraude_train.csv`
- Train balanceado: `data/ml/demo_scoring/dataset_demo_fraude_train_balanced.csv`
- Validation: `data/ml/demo_scoring/dataset_demo_fraude_validation.csv`
- Manifest: `data/ml/demo_scoring/dataset_demo_fraude_manifest.json`
- Modelo baseline demo: `modelo/modelo_fraude_demo_baseline_river.pkl`
- Metadata baseline demo: `modelo/modelo_fraude_demo_baseline_river.json`
