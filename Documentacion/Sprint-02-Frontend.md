# Sprint 02 - Frontend

## Dirigido a
Frontend del sistema ERS (React + TypeScript + Vite + MUI).

## Objetivo del sprint
Implementar el flujo de busqueda y evaluacion inicial para que el usuario pueda ingresar un DNI, CUIL o CUIT, validarlo, consultar un servicio mock y navegar al dashboard del caso cuando la evaluacion sea exitosa.

## Alcance implementado
- Nueva pagina principal `SearchPage`.
- Nuevo flujo de busqueda desacoplado en feature `search`.
- Validacion en tiempo real del identificador.
- Deteccion automatica de tipo:
  - DNI
  - CUIL
  - CUIT
- Estados contemplados:
  - identificador invalido
  - persona no encontrada
  - persona fallecida
  - sin datos suficientes
  - error tecnico de integracion
  - caso evaluable
- Listado de consultas recientes por usuario.
- Indicador visual de limite diario de consultas.
- Navegacion al dashboard del caso por identificador.
- Refactor del dashboard para funcionar como detalle de caso en ruta parametrizada.

## Estructura agregada
```text
ers-frontend/
  src/
    features/
      search/
        components/
          DailyLimitIndicator.tsx
          RecentSearchesCard.tsx
          SearchForm.tsx
        hooks/
          useSearchFlow.ts
        SearchPage.tsx
    models/
      search.ts
    services/
      searchService.ts
    mocks/
      searchMock.ts
```

## Tipos implementados
- `SearchRequest`
- `SearchResponse`
- `RecentSearch`
- `SearchOutcome`
- `IdentifierValidationResult`

## Servicios y helpers implementados
- `searchService.validateIdentifier`
- `searchService.evaluateIdentifier`
- `searchService.getRecentSearches`
- `searchService.getDailyUsage`
- `validateIdentifierWithFeedback`
- `useSearchFlow`

## Rutas ajustadas
- `/search` -> pantalla principal de busqueda
- `/dashboard/:identifier` -> dashboard del caso
- `/dashboard` -> redirect a `/search`
- `/` -> redirect a `/search`

## Decisiones tecnicas
- Se separo el flujo de busqueda en un feature propio para no mezclarlo con el detalle del caso.
- El dashboard dejo de ser la pantalla de entrada y paso a representar solamente el detalle de una evaluacion ya resuelta.
- Los recientes y el limite diario viven en un mock service en memoria para facilitar el reemplazo posterior por backend .NET.
- Se dejaron TODOs claros en `searchService.ts` para la futura integracion REST.

## Casos mock cargados
- `30111222` -> caso evaluable
- `20333444556` -> caso evaluable
- `27222333444` -> persona fallecida
- `27999888776` -> sin datos suficientes
- `20999999999` -> no encontrado
- `30000000000` -> error tecnico de integracion

## Validacion realizada
- Build exitoso con `npm.cmd run build`.

## Pendientes para siguientes sprints
- Persistencia real de recientes por usuario.
- Cuotas diarias reales informadas por backend.
- Integracion con API .NET para evaluacion real.
- Filtros adicionales y buscador avanzado.
- Mejoras de UX para estado exito previo a redireccion.
