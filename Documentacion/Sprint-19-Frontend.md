# Sprint 19 - Frontend

## Dirigido a
Frontend del sistema ERS (React + TypeScript + Vite + MUI).

## Objetivo del sprint
Conectar el frontend existente al backend demo real para el flujo principal del caso, manteniendo fallback controlado a mocks y sin alterar la UX actual.

## Alcance implementado
- `searchService` conectado de forma explicita a `/cases/evaluate`.
- `caseService` conectado de forma explicita a:
  - `/cases/{id}`
  - `/cases/{id}/graph`
  - `/cases/{id}/decision`
- Se mantuvieron los adapters entre DTOs backend y modelos UI.
- Se agregaron feature flags para:
  - habilitar backend demo
  - permitir o bloquear fallback a mocks
- Se incorporaron headers de actor y autenticacion en las llamadas del detalle de caso y resolucion manual.
- Se ajusto el copy de busqueda para reflejar que la demo consume backend real demo.

## Estructura impactada
```text
Documentacion/
  Sprint-19-Frontend.md
docs/
  architecture/
    demo-frontend-backend-integration.md
ers-frontend/
  src/
    config/
      runtimeFlags.ts
    features/
      search/
        SearchPage.tsx
    services/
      caseService.ts
      searchService.ts
```

## Decisiones tecnicas
- El backend demo paso a ser la fuente primaria del flujo principal.
- El fallback a mocks no se elimino, pero dejo de ser implicito y ahora depende de flags.
- Los adapters existentes se conservaron para no propagar DTOs del backend al resto de la UI.
- No se tocaron rutas, guards ni componentes estructurales.

## Feature flags
- `VITE_USE_DEMO_BACKEND_SEARCH`
- `VITE_USE_DEMO_BACKEND_CASES`
- `VITE_USE_DEMO_BACKEND_CASE_DECISION`
- `VITE_ALLOW_MOCK_SEARCH_FALLBACK`
- `VITE_ALLOW_MOCK_CASE_FALLBACK`
- `VITE_ALLOW_MOCK_DECISION_FALLBACK`

## Flujo demo cubierto
- busqueda y evaluacion
- apertura de detalle de caso
- score y clase de riesgo
- alertas
- reasoning summary
- resolucion manual

## Validacion realizada
- `npm.cmd run build`
