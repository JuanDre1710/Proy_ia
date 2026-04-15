# Sprint 36 - Frontend polling de bandeja

## Objetivo

Actualizar la bandeja de casos antifraude automaticamente sin recargar la pagina.

## Cambios implementados

- La pantalla `Bandeja de Casos Antifraude` ahora hace polling contra:
  - `GET /cases`
- Intervalo configurado en frontend:
  - `15` segundos
- La actualizacion ocurre sobre estado local de React, sin recarga completa.

## Estado mantenido en UI

- Se detectan `nuevos casos` comparando el lote recibido contra el ultimo snapshot local.
- Se detectan `cambios de estado` comparando `caseStatus`.
- Los casos nuevos se destacan temporalmente con:
  - badge `Nuevo`
  - fondo azul suave
- Los casos con cambio de estado se destacan temporalmente con:
  - badge `Actualizado`
  - fondo naranja suave

## Cambios de componentes

- `CaseInboxPage.tsx`
  - agrega polling
  - mantiene diff local
  - muestra ultima actualizacion y contadores
- `DataTable.tsx`
  - agrega soporte para estilo por fila

## Verificacion

- `npm.cmd run build`
- Resultado: OK

## Limitaciones

- El diff actual detecta cambios por `caseStatus`.
- Si mas adelante hace falta resaltar otros cambios, conviene ampliar la comparacion a `score`, `priority` o `fraudOutcome`.
