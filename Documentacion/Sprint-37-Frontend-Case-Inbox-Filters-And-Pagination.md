# Sprint 37 - Frontend filtros, busqueda y paginacion de bandeja

## Objetivo

Mejorar la usabilidad operativa de la bandeja de casos antifraude.

## Cambios implementados

- Filtros por:
  - nivel de riesgo
  - estado
  - fecha desde
  - fecha hasta
- Busqueda por:
  - cliente
  - numero de siniestro
- Paginacion client-side para volumen:
  - 10
  - 25
  - 50 filas por pagina

## Comportamiento

- Los filtros y la busqueda se aplican sobre el estado local ya cargado por la bandeja.
- El polling sigue activo y convive con los filtros actuales.
- Cuando cambian filtros o busqueda, la pagina vuelve a `0`.
- Si no hay resultados para el criterio activo, la pantalla muestra estado vacio claro.

## Archivos impactados

- `ers-frontend/src/features/cases/CaseInboxPage.tsx`

## Verificacion

- `npm.cmd run build`
- Resultado: OK

## Limitaciones

- La paginacion actual es local sobre el dataset cargado en memoria.
- Si en el futuro la bandeja crece mucho, conviene migrar filtros y paginacion al backend.
