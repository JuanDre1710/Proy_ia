# Sprint 12 - Backend IA

## Dirigido a
Trazabilidad real, auditoria operativa y exportaciones persistidas del sistema.

## Objetivo del sprint
Implementar auditoria real de acciones criticas, lectura server-side de logs y exportaciones PDF/CSV persistidas a disco, conectando el frontend existente sin redisenar la UI.

## Alcance implementado

### Auditoria real

Se consolidaron logs reales para:

- login y logout
- creacion y evaluacion de caso
- consumo de integraciones
- ejecucion de reglas duras
- ejecucion de reasoning
- ejecucion de scoring
- decision manual
- cambios administrativos originados desde la UI
- exportaciones

La auditoria se persiste en `data/audit_logs.jsonl`.

### Consulta de auditoria

Se implemento:

- `GET /audit/logs`

Con soporte de:

- filtros por usuario, rol, accion, resultado y rango de fechas
- paginacion server-side
- orden server-side

Tambien se agrego un endpoint auxiliar para registrar eventos administrativos desde la UI actual:

- `POST /audit/logs/events`

### Exportaciones reales

Se implementaron:

- `POST /cases/{caseId}/exports/pdf`
- `POST /cases/{caseId}/exports/csv`
- `GET /exports/{exportId}`

Las exportaciones:

- generan archivos reales
- se guardan en `data/exports/files`
- persisten metadata en `data/exports/exports.json`
- registran auditoria de exportacion

### Permisos

Se aplico control basico por rol en endpoints nuevos:

- auditoria: `Admin` y `Supervisor`
- exportaciones de caso: `Admin`, `Supervisor`, `Evaluador`

Se soporta token bearer real y fallback de headers de actor para no romper la UI actual durante la migracion.

### Frontend

Quedo conectado sin redisenar:

- `AuditLogsPage` contra `GET /audit/logs`
- `ExportActionsCard` contra exportaciones reales del backend
- `adminService` deja trazabilidad real de cambios administrativos aun cuando parte de la configuracion siga mockeada

## Estructura impactada

```text
Documentacion/
  Sprint-12-Backend-IA.md
ers_core/
  adapters/
    repositories/
      file_audit_log_repository.py
      file_export_repository.py
  application/
    ports/
      integration_repository.py
    services/
      case_export_service.py
      case_pipeline_service.py
  domain/
    enums.py
    models.py
ia_fraude/
  api/
    audit_routes.py
    audit_schemas.py
    export_routes.py
    export_schemas.py
    security.py
  app.py
  smoke_case_pipeline.py
ers-frontend/
  src/
    services/
      authService.ts
      auditService.ts
      exportService.ts
      adminService.ts
    features/
      audit/
        components/
          AuditLogFilters.tsx
      cases/
        components/
          ExportActionsCard.tsx
```

## Decisiones tecnicas

- La auditoria se mantiene append-only en JSONL para simplicidad y trazabilidad.
- Las exportaciones no quedan solo en memoria; se generan y persisten con metadata.
- Se distinguio `Exportacion CSV` y `Exportacion PDF` en la vista de auditoria usando metadata del evento.
- Se mantuvo la UI existente y se uso fallback controlado para no bloquear el flujo en entornos mixtos.

## Como probarlo manualmente

### Auditoria

1. Iniciar sesion
2. Evaluar un caso
3. Abrir `/audit/logs`

Resultado esperado:

- aparecen eventos reales de login, evaluacion y pipeline
- los filtros responden desde backend

### Exportaciones

1. Abrir un caso existente
2. Ejecutar exportacion PDF o CSV
3. Revisar `data/exports/files`

Resultado esperado:

- se descarga un archivo real
- queda registro en `data/exports/exports.json`
- aparece log de exportacion en auditoria

## Como corroborarlo rapido

1. Ejecutar `python ia_fraude/smoke_case_pipeline.py`
2. Revisar `data/case_pipeline_smoke/audit_logs.jsonl`
3. Revisar `data/case_pipeline_smoke/exports/exports.json`

Resultado esperado:

- `audit logs query and exports persisted`: OK
- existen archivos en `data/case_pipeline_smoke/exports/files`

## Validacion realizada

- `python -m compileall ers_core ia_fraude`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `npm.cmd run build` en `ers-frontend`: OK

## Restricciones respetadas

- Nada critico del pipeline nuevo queda sin log.
- Las exportaciones no quedan solo en memoria.
- Se respetan permisos por rol en endpoints de auditoria y exportacion.

## Deuda pendiente / siguiente paso

- endurecer permisos tambien en todos los endpoints administrativos existentes
- agregar retencion y archivado de auditoria
- incorporar plantillas PDF mas ricas si se necesita formato corporativo
