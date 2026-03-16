# Sprint 07 - Frontend

## Dirigido a
Frontend del sistema ERS (React + TypeScript + Vite + MUI).

## Objetivo del sprint
Construir un panel administrativo para configuracion central del sistema, con acceso exclusivo para usuarios ADMIN y estructura lista para futura integracion real.

## Alcance implementado
- Nueva pagina administrativa principal:
  - `/admin`
- Acceso restringido al rol `Administrador`.
- Ocultamiento de la opcion del menu para usuarios sin permisos.
- Visualizacion de `AccessDeniedPage` cuando un usuario autenticado intenta ingresar sin autorizacion.
- Formularios tipados con `react-hook-form` + `zod`.
- Persistencia mock desacoplada con loading, mensajes de exito y restauracion de valores mock.
- Cards separadas por seccion:
  - configuracion de umbrales de riesgo
  - resumen de reglas activas
  - estado de integraciones
  - parametros generales del sistema
  - configuracion de exportaciones

## Componentes implementados
- `AdminPage`
- `ThresholdConfigCard`
- `RulesSummaryCard`
- `IntegrationStatusCard`
- `SystemSettingsCard`
- `ExportSettingsCard`

## Tipos agregados
- `RiskThresholdConfig`
- `ActiveRule`
- `IntegrationStatus`
- `SystemSetting`
- `ExportSetting`
- `AdminPanelData`

## Estructura impactada
```text
Documentacion/
  Sprint-07-Frontend.md
ers-frontend/
  src/
    features/
      admin/
        AdminPage.tsx
        components/
          ThresholdConfigCard.tsx
          RulesSummaryCard.tsx
          IntegrationStatusCard.tsx
          SystemSettingsCard.tsx
          ExportSettingsCard.tsx
    models/
      admin.ts
    mocks/
      adminMock.ts
    services/
      adminService.ts
    router/
      RouterProvider.tsx
      ProtectedRoute.tsx
    components/
      layout/
        AppShell.tsx
  package.json
```

## Escenarios mock cubiertos
- actualizacion de umbrales centrales de riesgo
- consulta de reglas activas y monitoreadas
- visualizacion del estado de integraciones operativas y degradadas
- configuracion de parametros generales del sistema
- ajuste de politicas de exportacion con restauracion a valores mock

## Decisiones tecnicas
- Se separo el dominio administrativo en `models`, `mocks` y `services` para mantener el frontend listo para reemplazo por APIs reales.
- Cada card mantiene su propio flujo de guardado y restauracion para evitar acoplar estados de formularios independientes.
- Se endurecio el control de acceso dejando `/admin` exclusivo para `Administrador`, sin compartir permisos con `Supervisor`.
- El menu lateral solo muestra la opcion administrativa cuando el usuario autenticado tiene el rol correcto.
- Se incorporaron `react-hook-form`, `zod` y `@hookform/resolvers` para validaciones consistentes y tipadas.

## Uso rapido
1. Iniciar sesion con el usuario mock `admin / Admin#123`
2. Ingresar a `/admin`
3. Probar cambios en cualquiera de las cards de configuracion
4. Guardar o restaurar valores mock y verificar mensajes visuales

## Validacion realizada
- `npm.cmd install`
- `npm.cmd run build`
