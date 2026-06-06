# Sprint 16 - Backend IA

## Dirigido a
Encapsulacion del modelo demo como servicio interno de scoring consumible por el backend.

## Objetivo del sprint

Desacoplar la inferencia del modelo demo dentro de un servicio interno estable, con contrato claro de entrada y salida, manejo de errores y documentacion de integracion.

## Alcance implementado

### Servicio interno de scoring

Se agrego:

- `DemoInternalScoringService`
- `DemoScoringRequest`
- `DemoScoringResponse`
- `DemoScoringServiceError`

Ubicacion:

- `ia_fraude/modelos/demo_internal_scoring_service.py`

### Integracion con backend

`TabularScoringService` quedo como adaptador entre el dominio del caso y el servicio interno:

- construye features desde `Case`
- transforma features en request tipado
- consume el servicio interno
- transforma la salida en `ScoreResult`

### Contrato del scoring

Entrada:

- features tabulares del caso ya normalizadas

Salida:

- `score`
- `riskClass`
- `confidence`
- `topFactors`
- `modelName`
- `modelVersion`

### Manejo de errores

Se incorporo:

- validacion minima de features numericas
- excepcion explicita `DemoScoringServiceError`
- fallback heuristico en `TabularScoringService` si el servicio interno falla

### Testing

Se agrego test unitario para:

- contrato valido de prediccion
- rechazo de inputs invalidos
- fallback del servicio de scoring del backend

## Estructura impactada

```text
Documentacion/
  Sprint-16-Backend-IA.md
docs/
  architecture/
    demo-internal-scoring-service.md
ia_fraude/
  modelos/
    demo_internal_scoring_service.py
    predictor_fraude.py
ers_core/
  application/
    services/
      tabular_scoring_service.py
tests/
  test_unit_demo_internal_scoring_service.py
```

## Como corroborarlo rapido

```powershell
venv\Scripts\python.exe -m unittest tests.test_unit_demo_internal_scoring_service -v
venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py
venv\Scripts\python.exe -m compileall ia_fraude\modelos ers_core\application\services tests
```

## Validacion realizada

- `venv\Scripts\python.exe -m unittest tests.test_unit_demo_internal_scoring_service -v`: OK
- `venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py`: OK
- `venv\Scripts\python.exe -m compileall ia_fraude\modelos ers_core\application\services tests`: OK

## Restricciones respetadas

- No se agregaron dependencias externas.
- No se introdujo una arquitectura compleja.
- La implementacion quedo desacoplada del frontend.
- Se priorizo robustez demo y mantenibilidad.

## Deuda pendiente

- separar a futuro la carga del modelo en una interfaz de infraestructura si el proyecto escala
- agregar observabilidad especifica de scoring si se necesita trazabilidad mas fina
- reevaluar el fallback heuristico cuando exista un modelo demo mas fuerte
