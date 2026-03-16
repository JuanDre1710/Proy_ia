# Sprint 08 - Frontend

## Dirigido a
Frontend del sistema ERS (React + TypeScript + Vite + MUI).

## Objetivo del sprint
Crear una seccion de auditoria para consultar logs de actividad del sistema con filtros, ordenamiento, paginacion y detalle expandido, accesible para ADMIN y SUPERVISOR.

## Alcance implementado
- Nueva pagina de auditoria:
  - `/audit/logs`
- Acceso habilitado para roles:
  - `Administrador`
  - `Supervisor`
- Compatibilidad con ruta legacy:
  - `/admin/logs` redirige a `/audit/logs`
- Filtros por:
  - usuario
  - rol
  - fecha desde / hasta
  - accion
  - resultado
- Tabla MUI con:
  - paginacion
  - ordenamiento
  - empty state
  - loading state
  - error state
- Exportacion mock a CSV.
- Dialogo para ver detalle completo del log.

## Componentes implementados
- `AuditLogsPage`
- `AuditLogFilters`
- `AuditLogsTable`
- `AuditLogDetailDialog`

## Tipos agregados
- `AuditLogEntry`
- `AuditLogFilter`
- `AuditActionType`
- `AuditResultType`
- `AuditLogQuery`
- `AuditLogPage`

## Estructura impactada
```text
Documentacion/
  Sprint-08-Frontend.md
ers-frontend/
  src/
    features/
      audit/
        AuditLogsPage.tsx
        components/
          AuditLogFilters.tsx
          AuditLogsTable.tsx
          AuditLogDetailDialog.tsx
    models/
      audit.ts
    mocks/
      auditMock.ts
    services/
      auditService.ts
    router/
      RouterProvider.tsx
    components/
      layout/
        AppShell.tsx
```

## Escenarios mock cubiertos
- inicio y cierre de sesion
- consultas de riesgo
- exportaciones CSV y PDF
- actualizaciones de umbrales
- cambios de parametros generales
- revisiones manuales de casos
- eventos con resultado `OK`, `Observado`, `Bloqueado` y `Error`

## Decisiones tecnicas
- Se implemento con `Table` de MUI en lugar de `DataGrid`, ya que no estaba disponible en el proyecto y no era necesario incorporar una dependencia adicional.
- El servicio `auditService` aplica filtros, ordenamiento y paginacion en memoria, manteniendo una interfaz cercana a una futura API real.
- La exportacion mock reutiliza un flujo de descarga simple desacoplado del resto de la UI.
- El detalle del log se resolvio con `Dialog` para mantener el layout principal estable y no romper la navegacion existente.
- La ruta de auditoria se separo del panel administrativo para permitir acceso a `Supervisor` sin exponer configuraciones sensibles.

## Uso rapido
1. Iniciar sesion con `admin / Admin#123` o `supervisor / Super#123`
2. Ingresar a `/audit/logs`
3. Aplicar filtros y ordenar columnas
4. Abrir el detalle de cualquier evento desde la tabla
5. Exportar el resultado visible a CSV mock

## Validacion realizada
- `npm.cmd run build`
