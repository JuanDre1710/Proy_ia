# Demo Frontend-Backend Integration

## Objetivo
Conectar el frontend existente al backend demo sin rediseñar pantallas ni acoplar la UI a mocks permanentes.

## Estrategia aplicada
- `searchService` usa `/cases/evaluate` como fuente principal.
- `caseService` usa `/cases/{id}`, `/cases/{id}/graph` y `/cases/{id}/decision` como fuente principal.
- Los adapters de frontend siguen siendo la frontera entre DTOs backend y modelos UI:
  - `mapBackendCase`
  - mapeo de `SearchResponse`
- El fallback a mocks sigue disponible solo como mecanismo controlado por flags de runtime.

## Feature Flags
- `VITE_USE_DEMO_BACKEND_SEARCH=true`
- `VITE_USE_DEMO_BACKEND_CASES=true`
- `VITE_USE_DEMO_BACKEND_CASE_DECISION=true`
- `VITE_ALLOW_MOCK_SEARCH_FALLBACK=true`
- `VITE_ALLOW_MOCK_CASE_FALLBACK=true`
- `VITE_ALLOW_MOCK_DECISION_FALLBACK=true`

Si las flags `VITE_USE_DEMO_BACKEND_*` estan en `false`, la UI vuelve a mocks de forma deliberada.
Si las flags `VITE_ALLOW_MOCK_*_FALLBACK` estan en `false`, cualquier error del backend se expone a la UI y no se degrada a mocks.

## Contratos relevantes
### Busqueda y evaluacion
- Entrada UI:
  - `identifier`
  - `requestedBy`
- Endpoint:
  - `POST /cases/evaluate`
- Salida esperada:
  - `caseId`
  - `identifier`
  - `identifierType`
  - `status`
  - `message`
  - `canOpenDashboard`

### Detalle del caso
- Endpoints:
  - `GET /cases/{caseId}`
  - `GET /cases/{caseId}/graph`
- El frontend adapta:
  - score
  - alertas
  - reasoning summary
  - evidencia
  - inconsistencias
  - final assessment
  - resolucion manual

### Resolucion manual
- Endpoint:
  - `POST /cases/{caseId}/decision`
- Headers:
  - `Authorization` si hay sesion real
  - `X-Actor-Id`
  - `X-Actor-Name`
  - `X-Actor-Role`

## Alcance demo
- El frontend ya consume datos reales demo de backend para el flujo principal.
- Los mocks siguen disponibles solo para contingencia de demo local.
- No se modifica dominio UI ni rutas para preparar el reemplazo futuro por integraciones reales.
