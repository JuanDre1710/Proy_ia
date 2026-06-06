# Sprint 35 - Frontend final resolution de casos

## Objetivo

Permitir registrar el resultado final del caso desde el detalle operativo.

## Cambios implementados

- Se agregaron acciones de resultado final:
  - `Confirmar fraude`
  - `Marcar como no fraude`
- La UI muestra el resultado final como:
  - `FRAUDE`
  - `NO FRAUDE`
- Cuando el caso queda cerrado, la tarjeta bloquea edicion:
  - comentario
  - decision operativa
  - resolucion final

## Integracion backend

- Endpoint objetivo:
  - `POST /cases/{id}/resolution`
- Fallback temporal de compatibilidad:
  - `POST /monitoring/cases/{id}/resolution`

## Contrato frontend

Se envia:

- `fraudeConfirmado`
- `comment`
- `comentario`
- `usuario`
- `usuarioDecision`
- `actorId`
- `actorName`
- `actorRole`

## Reglas UI

- Si `fraudeConfirmado = true`, se muestra `FRAUDE`.
- Si `fraudeConfirmado = false`, se muestra `NO FRAUDE`.
- Una respuesta exitosa actualiza el estado local del caso a `Cerrado`.
- El detalle queda bloqueado despues del cierre para evitar nuevas ediciones sobre el mismo caso.

## Archivos impactados

- `ers-frontend/src/models/cases.ts`
- `ers-frontend/src/services/caseService.ts`
- `ers-frontend/src/features/cases/components/CaseDecisionCard.tsx`
- `ers-frontend/src/features/cases/CaseDashboardPage.tsx`

## Verificacion

- `npm.cmd run build`
- Resultado: OK

## Limitaciones

- El frontend mantiene fallback a la ruta legacy de monitoreo mientras el backend converge sobre `/cases/{id}/resolution`.
