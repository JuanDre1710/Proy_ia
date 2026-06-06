# Sprint 14 - Backend IA

## Dirigido a
Preparacion del dataset demo para entrenamiento y validacion baseline del scoring antifraude.

## Objetivo del sprint

Dejar una base sintetica curada, documentada y versionada dentro del proyecto para poder entrenar y validar un baseline de fraude sin tocar integraciones externas ni el modelo operativo actual.

## Alcance implementado

### Dataset demo preparado

Se incorporo el dataset fuente dentro del repo:

- `data/ml/demo_scoring/dataset_demo_fraude_1000_raw.csv`

Se genero una version preparada para entrenamiento:

- normalizacion de categoricas a lowercase
- validacion de numericas y binarias
- parseo de `fecha_siniestro`
- derivacion de:
  - `mes_siniestro`
  - `trimestre_siniestro`
  - `dia_semana_siniestro`
  - `fin_de_semana_siniestro`

### Estrategia de features

Se fijo:

- target principal: `fraude`
- features de baseline: variables tabulares demograficas, financieras, operativas y temporales derivadas
- variables auxiliares: `case_id`, `dni`, `requiere_revision`, `nivel_riesgo`

Se excluyeron por riesgo de fuga o bajo valor operativo:

- `case_id`
- `dni`
- `fecha_siniestro` cruda
- `requiere_revision`
- `nivel_riesgo`
- `cluster_fraude`

### Splits y balanceo demo

Se generaron:

- `dataset_demo_fraude_train.csv`
- `dataset_demo_fraude_train_balanced.csv`
- `dataset_demo_fraude_validation.csv`
- `dataset_demo_fraude_manifest.json`

Distribucion obtenida:

- dataset completo: 1000 filas, 3 positivos
- train: 800 filas, 2 positivos
- train balanceado: 840 filas, 42 positivos
- validation: 200 filas, 1 positivo

### Automatizacion incorporada

Se agregaron scripts nuevos:

- `ia_fraude/modelos/entrenar_reentrenar/preparar_dataset_demo_scoring.py`
- `ia_fraude/modelos/entrenar_reentrenar/entrenar_modelo_fraude_demo_baseline.py`

El entrenamiento baseline guarda artefactos separados del modelo runtime:

- `modelo/modelo_fraude_demo_baseline_river.pkl`
- `modelo/modelo_fraude_demo_baseline_river.json`

## Estructura impactada

```text
Documentacion/
  Sprint-14-Backend-IA.md
data/
  ml/
    demo_scoring/
      dataset_demo_fraude_1000_raw.csv
      dataset_demo_fraude_preparado.csv
      dataset_demo_fraude_train.csv
      dataset_demo_fraude_train_balanced.csv
      dataset_demo_fraude_validation.csv
      dataset_demo_fraude_manifest.json
docs/
  ml/
    demo-scoring-feature-strategy.md
ia_fraude/
  modelos/
    entrenar_reentrenar/
      preparar_dataset_demo_scoring.py
      entrenar_modelo_fraude_demo_baseline.py
modelo/
  modelo_fraude_demo_baseline_river.pkl
  modelo_fraude_demo_baseline_river.json
```

## Como corroborarlo rapido

```powershell
venv\Scripts\python.exe ia_fraude\modelos\entrenar_reentrenar\preparar_dataset_demo_scoring.py
venv\Scripts\python.exe ia_fraude\modelos\entrenar_reentrenar\entrenar_modelo_fraude_demo_baseline.py
venv\Scripts\python.exe -m compileall ia_fraude\modelos\entrenar_reentrenar
```

## Validacion realizada

- `venv\Scripts\python.exe ia_fraude\modelos\entrenar_reentrenar\preparar_dataset_demo_scoring.py`: OK
- `venv\Scripts\python.exe ia_fraude\modelos\entrenar_reentrenar\entrenar_modelo_fraude_demo_baseline.py`: OK
- `venv\Scripts\python.exe -m compileall ia_fraude\modelos\entrenar_reentrenar`: OK

Metricas observadas en validation del baseline:

- `accuracy = 0.995`
- `precision = 0.0`
- `recall = 0.0`
- `f1 = 0.0`

## Restricciones respetadas

- No se asumieron datos reales.
- No se integraron proveedores externos.
- Se mantuvo foco en demo funcional.
- No se reemplazo el modelo activo del runtime.

## Observaciones y limitaciones

- El dataset es demasiado pequeno en positivos para una evaluacion seria del modelo.
- `nivel_riesgo` y `requiere_revision` quedan documentadas solo como variables auxiliares.
- El baseline resultante valida el circuito tecnico, no la calidad productiva del scoring.

## Deuda pendiente

- Generar mas positivos sinteticos con reglas mejor controladas para evitar memorizar 2 o 3 casos.
- Incorporar validacion con metricas mas robustas para clase minoritaria una vez que exista mayor volumen positivo.
- Alinear un futuro dataset de entrenamiento con las features reales que consume el scoring tabular del pipeline de casos.
