# Sprint 42 - FullStack Commercial Analytics Filters And Drilldown

## Objetivo

Mejorar la pantalla de analitica comercial para supervisores con filtros operativos, paginacion por bloque y drill-down simple sin recargar la UI.

## Backend

### Mejoras implementadas

- filtros server-side extendidos en `CommercialAnalyticsQueryDto`
- soporte adicional para `planId`
- soporte de `sortBy` y `sortDirection`
- paginacion real por endpoint en:
  - `GET /commercial/top-products`
  - `GET /commercial/clients/without-policies`
  - `GET /commercial/clients/quoted-not-bought`
- `top-products` ahora devuelve `totalCount`

### Drill-down nuevos

- `GET /commercial/products/{productId}/detail`
- `GET /commercial/clients/{clientId}/detail`

### Detalle de producto

Devuelve:

- resumen del producto
- desglose por planes
- desglose por sucursales
- desglose por canales
- desglose por vendedores

### Detalle de cliente

Devuelve:

- resumen del cliente
- cantidad de cotizaciones y polizas
- ultimas cotizaciones
- ultimas polizas
- indicador de cotizaciones sin compra posterior

## Frontend

### Cambios principales

- se reemplazo la carga unica del dashboard por cargas paralelas por bloque
- cada tabla ahora tiene paginacion propia
- cada tabla ahora tiene ordenamiento simple via selects
- se agrego filtro adicional `planId`
- el click en producto abre un dialog de desglose
- el click en cliente abre un dialog de detalle resumido

### UX mantenida

- sin rehacer layout
- sin tabs complejas ni modales encadenados
- filtros visibles en un solo bloque
- drill-down liviano dentro de dialogs

## Archivos principales

- `Ers.SqlServerApi/Application/CommercialAnalyticsDtos.cs`
- `Ers.SqlServerApi/Application/CommercialAnalyticsService.cs`
- `Ers.SqlServerApi/Program.cs`
- `ers-frontend/src/models/commercialAnalytics.ts`
- `ers-frontend/src/services/commercialAnalyticsService.ts`
- `ers-frontend/src/features/commercial-analytics/CommercialAnalyticsPage.tsx`

## Limitaciones mantenidas

- `quotedNotBought` sigue sin filtro seguro por producto o plan porque `COTIZACIONES` usa `TPR_ID`
- `clientsWithoutPolicies` no soporta filtros comerciales porque no existen dimensiones de emision para esos clientes
- el filtro por vendedor depende de la cobertura parcial de `PZA_VENDEDORES_CANAL_VTA`
