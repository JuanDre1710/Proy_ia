# Sprint 41 - Frontend Commercial Analytics V1

## Objetivo

Agregar una nueva pantalla al frontend React + TypeScript + MUI para visualizar analitica comercial de polizas y conversion, consumiendo backend real.

## Alcance implementado

- nueva feature `src/features/commercial-analytics/`
- nueva ruta protegida `GET /commercial-analytics` en frontend
- acceso nuevo en el menu lateral
- integracion HTTP real contra `/commercial/dashboard`
- estados `loading`, `empty` y `error`
- tablas para:
  - clientes sin poliza
  - clientes que cotizaron y no compraron
- bloques de resumen y ranking de productos

## Archivos agregados

- `src/features/commercial-analytics/CommercialAnalyticsPage.tsx`
- `src/models/commercialAnalytics.ts`
- `src/services/commercialAnalyticsService.ts`

## Archivos actualizados

- `src/router/RouterProvider.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/AppBreadcrumbs.tsx`

## Decisiones de integracion

- no se rehizo layout ni estructura general
- se reutilizaron `PageHeader`, `SectionCard`, `KpiCard`, `DataTable` y `StatusState`
- se consumio backend real con `fetch` y `authService.getActorHeaders()`
- no se expone el payload crudo del backend: el servicio mapea la respuesta a modelos UI

## Ruta y roles

Ruta agregada:

- `/commercial-analytics`

Suposicion operativa aplicada en esta V1:

- la pantalla queda visible para `Administrador` y `Supervisor`
- no existe hoy un rol comercial dedicado en el frontend
- por eso se reutilizo la segmentacion ya existente para vistas operativas internas

## Contenido de la pantalla

### Resumen

Se renderizan 4 cards:

- polizas vendidas
- producto mas comercializado
- clientes sin poliza
- cotizaron y no compraron

### Ranking

- tabla con top productos
- columnas de polizas, clientes unicos, premio total y ultima emision
- aviso visual con el producto lider actual

### Clientes sin poliza

- tabla paginada
- muestra cliente, documento, email, bandera de cotizacion y ultima cotizacion

### Cotizaron y no compraron

- tabla paginada
- muestra cliente, documento, email, cotizacion, fecha y tipo cotizado

### Criterios operativos

- se muestran en pantalla las definiciones documentadas por backend
- tambien se muestran limitaciones y filtros no soportados por la V1

## Filtros UI

Se agregaron filtros visuales para:

- fecha desde
- fecha hasta
- sucursal
- canal
- producto
- vendedor
- cantidad de registros

Notas:

- los ids comerciales se ingresan como numericos porque el backend actual trabaja con ids
- la pantalla informa que filtros estan soportados realmente por el backend
- los filtros no soportados quedan explicitados mediante alertas informativas

## Restricciones respetadas

- no se rehizo la app
- no se mezclaron conceptos antifraude en la nueva vista comercial
- no se usaron mocks
- no se expone respuesta raw del backend
- se mantuvo la navegacion lateral y rutas protegidas existentes
