# Sprint 43 - FullStack Commercial Analytics Operational Closure

## Objetivo

Cerrar el modulo de analitica comercial para uso real dentro del sistema con permisos, exportacion y comportamiento robusto.

## Roles habilitados

Roles habilitados en esta version:

- `Administrador`
- `Supervisor`

Rol no habilitado por defecto:

- `Evaluador`

Motivo:

- no hay aprobacion funcional explicita para exponer informacion comercial operativa al rol evaluador
- se mantuvo la sugerencia pedida: acceso para `Administrador` y `Supervisor`

## Permisos aplicados

### Frontend

- la ruta `/commercial-analytics` sigue protegida por `ProtectedRoute`
- solo se permite acceso a `Administrador` y `Supervisor`

### Backend

- todos los endpoints `/commercial/*` validan `X-Actor-Role`
- solo aceptan `Admin` y `Supervisor`
- si el rol no aplica, la API responde `403` con mensaje explicito

## Exportaciones basicas

Se agregaron exportaciones CSV:

- `GET /commercial/exports/summary.csv`
- `GET /commercial/exports/clients-without-policies.csv`
- `GET /commercial/exports/quoted-not-bought.csv`

Notas:

- exportan el recorte filtrado actual
- para listados se usa un tope operativo de 5000 filas en esta version
- si no hay datos, el CSV sale con encabezados y una fila informativa

## UX y robustez

- mensajes mas claros ante `401`, `403`, `404` y `5xx`
- mensajes de “no disponible” cuando una metrica no puede determinarse
- mensajes explicitos cuando no hay datos suficientes para un desglose
- exportaciones con feedback visual en pantalla

## Supuestos de negocio mantenidos

- no se inventan definiciones comerciales no validadas
- si la base no permite relacion segura, se informa como limitacion o no disponible
- `quoted-not-bought` sigue sin filtro seguro por `productId` o `planId` porque `COTIZACIONES` trabaja con `TPR_ID`
- el desglose por vendedor depende de la cobertura parcial de `PZA_VENDEDORES_CANAL_VTA`

## Endpoints comerciales activos

- `GET /commercial/dashboard`
- `GET /commercial/summary`
- `GET /commercial/top-products`
- `GET /commercial/products/{productId}/detail`
- `GET /commercial/clients/without-policies`
- `GET /commercial/clients/{clientId}/detail`
- `GET /commercial/clients/quoted-not-bought`
- `GET /commercial/exports/summary.csv`
- `GET /commercial/exports/clients-without-policies.csv`
- `GET /commercial/exports/quoted-not-bought.csv`
