# Sprint 40 - Backend Commercial Analytics V1

## Objetivo

Primera version backend para una nueva vista operativa/comercial enfocada en polizas, productos y conversion comercial, separada del flujo antifraude.

## Alcance implementado

- servicio `CommercialAnalyticsService`
- endpoints nuevos bajo `/commercial`
- contrato backend con secciones `summary`, `topProducts`, `clientsWithoutPolicies` y `quotedNotBought`
- criterios de negocio y limitaciones documentadas

## Tablas reales usadas

Fuente principal para ventas:

- `POLIZAS`
- `PLANES`
- `PRODUCTOS`
- `SUCURSALES`
- `PZA_VENDEDORES_CANAL_VTA`
- `VENDEDORES_CANAL_VTA`

Fuente principal para conversion:

- `COTIZACIONES`
- `TIPO_PRODUCTOS`
- `EXT_CLIENTES`

## Relaciones usadas

- `POLIZAS.PLA_ID -> PLANES.PLA_ID`
- `PLANES.PRO_ID -> PRODUCTOS.PRO_ID`
- `POLIZAS.SUC_VENTA -> SUCURSALES.SUC_ID`
- `PZA_VENDEDORES_CANAL_VTA.PZA_NROSOL -> POLIZAS.PZA_NROSOL`
- `PZA_VENDEDORES_CANAL_VTA.VCV_ID -> VENDEDORES_CANAL_VTA.VCV_ID`
- `POLIZAS.CLI_IDTITULAR -> EXT_CLIENTES.CLI_ID`
- `COTIZACIONES.CLI_ID -> EXT_CLIENTES.CLI_ID`
- `COTIZACIONES.TPR_ID -> TIPO_PRODUCTOS.TPR_ID`

## Endpoints

- `GET /commercial/dashboard`
- `GET /commercial/summary`
- `GET /commercial/top-products`
- `GET /commercial/clients/without-policies`
- `GET /commercial/clients/quoted-not-bought`

Query params soportados por contrato:

- `startDate`
- `endDate`
- `branchId`
- `channelId`
- `productId`
- `sellerId`
- `take`
- `offset`

## Criterios de negocio implementados

### Poliza vendida

Definicion operativa usada en este sprint:

- toda fila existente en `POLIZAS`
- el conteo se filtra por `PZA_FECALTA`
- se pueden aplicar filtros por sucursal, canal, producto y vendedor cuando esas columnas existen

Motivo:

- no se encontro en esta inspeccion un catalogo funcional documentado de `PZA_ESTADO`
- para no inventar reglas, no se excluyen estados en esta V1
- el endpoint devuelve tambien `policyStatusBreakdown` para transparentar la distribucion de estados

### Producto mas comercializado

Definicion operativa:

- agrupacion de polizas por `PRODUCTOS.PRO_ID`
- usando `POLIZAS -> PLANES -> PRODUCTOS`
- el ranking se ordena por cantidad de polizas

### Cliente sin poliza

Definicion operativa:

- cliente presente en `EXT_CLIENTES`
- que no aparece como titular en `POLIZAS.CLI_IDTITULAR`

Limitacion:

- estos clientes no tienen dimensiones comerciales de emision
- por eso en esta V1 no se aplican filtros de fecha, sucursal, canal, producto o vendedor sobre este listado

### Cotizo pero no compro

Definicion operativa:

- se toma la ultima cotizacion por cliente en `COTIZACIONES`
- el cliente entra en el listado si no existe una fila en `POLIZAS` con el mismo `CLI_IDTITULAR` y `PZA_FECALTA >= COT_FECHA`

Motivo:

- evita duplicar clientes con multiples cotizaciones
- usa una regla observable con datos reales de la base

Limitaciones:

- no existe una llave explicita cotizacion -> poliza en las tablas inspeccionadas
- `COTIZACIONES` maneja `TPR_ID`, no `PRODUCTOS.PRO_ID`
- por eso el filtro `productId` no se aplica de forma segura a `quotedNotBought`
- `COTIZACIONES` no expone sucursal, canal ni vendedor para este caso

## Cobertura real de filtros

### `summary`

- aplica `startDate`, `endDate`, `branchId`, `channelId`, `productId`, `sellerId` a metricas basadas en `POLIZAS`
- ignora filtros no disponibles para `clientsWithoutPolicies` y `quotedNotBought`

### `top-products`

- aplica `startDate`, `endDate`, `branchId`, `channelId`, `productId`, `sellerId`

### `clients/without-policies`

- no aplica filtros comerciales en esta V1

### `clients/quoted-not-bought`

- aplica `startDate`, `endDate`
- no aplica `branchId`, `channelId`, `productId`, `sellerId`

## Contrato de salida

### `summary`

- `filters`
- `supportedFilters`
- `unsupportedFilters`
- `summary.policiesSoldCount`
- `summary.mostCommercializedProduct`
- `summary.clientsWithoutPoliciesCount`
- `summary.quotedNotBoughtCount`
- `summary.policyStatusBreakdown`
- `summary.criteria`

### `topProducts`

- `filters`
- `supportedFilters`
- `unsupportedFilters`
- `offset`
- `take`
- `items[]`

### `clientsWithoutPolicies`

- `filters`
- `supportedFilters`
- `unsupportedFilters`
- `totalCount`
- `offset`
- `take`
- `items[]`

### `quotedNotBought`

- `filters`
- `supportedFilters`
- `unsupportedFilters`
- `totalCount`
- `offset`
- `take`
- `items[]`

## Notas tecnicas

- no se toco frontend
- no se mezclo con el pipeline antifraude
- no se usaron mocks
- los DTOs de respuesta estan separados de entidades EF
- la implementacion consulta SQL Server real desde `Ers.SqlServerApi`
