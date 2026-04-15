# Sprint 34 - Frontend Case Decisions

## Objetivo

Adaptar el frontend para registrar decisiones humanas sobre casos antifraude usando el backend incremental.

## Cambios implementados

- La tarjeta de decision del detalle ahora ofrece acciones:
  - `Aceptar`
  - `Denegar`
  - `Revisar`
- El comentario paso a ser opcional.
- La UI deja de usar el estado anterior basado en `Escalado` y pasa a mostrar estado operativo:
  - `Pendiente`
  - `En revision`
  - `Cerrado`
- La cabecera del caso muestra el estado operativo actualizado.
- La confirmacion visual sigue resolviendose con `Snackbar`.

## Integracion backend

- Endpoint principal:
  - `POST /cases/{id}/decision`
- Fallback de compatibilidad temporal:
  - `POST /monitoring/cases/{id}/decision`
- La UI intenta primero la ruta nueva y usa la anterior solo si la primera responde `404`.

## Payload enviado

Se envia un cuerpo tolerante para convivir con contratos en transicion:

- `decision`
- `action`
- `comment`
- `comentario`
- `actorId`
- `actorName`
- `actorRole`
- `usuarioDecision`
- `usuario`

## Reglas UI

- `Revisar` mueve el caso a `En revision`.
- `Aceptar` y `Denegar` lo mueven a `Cerrado`.
- El detalle actualiza el estado local inmediatamente despues de una respuesta exitosa.
- Al volver a la bandeja, la lista se recarga desde backend como parte del flujo normal de navegacion.

## Archivos impactados

- `ers-frontend/src/models/cases.ts`
- `ers-frontend/src/services/caseService.ts`
- `ers-frontend/src/features/cases/components/CaseDecisionCard.tsx`
- `ers-frontend/src/features/cases/components/CaseHeaderSummary.tsx`

## Verificacion

- `npm.cmd run build`
- Resultado: OK

## Limitaciones

- El frontend acepta mas de una forma de contrato de decision para soportar convivencia temporal entre endpoints.
- Si el backend devuelve una taxonomia distinta de decision, habra que consolidar el mapper y eliminar compatibilidad sobrante.
