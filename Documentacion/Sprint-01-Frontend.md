# Sprint 01 - Frontend

## Dirigido a
Frontend MVP del sistema ERS (Evaluador de Riesgos de Seguros).

## Objetivo del sprint
Construir una primera version navegable del frontend del sistema ERS. La implementacion final del sprint quedo en React + TypeScript + Vite + MUI, con arquitectura escalable, mocks funcionales y base lista para integrar con backend .NET REST.

## Alcance implementado
- Creacion de un proyecto frontend independiente en `ers-frontend/`.
- Configuracion base React + Vite + TypeScript.
- Routing principal con guards de autenticacion y rol.
- Layout general con sidenav, header y area de contenido.
- Pantalla de login con credenciales mock.
- Dashboard antifraude con busqueda por DNI, CUIL o CUIT.
- Validacion de identificador antes de consultar.
- Visualizacion de:
  - datos personales verificados
  - situacion financiera y bancarizacion
  - actividad laboral / fiscal
  - historial de siniestros
  - alertas visuales
  - explicacion del score IA
  - mapa de calor de riesgo
  - red de relaciones sospechosas
- Modulo administrativo para:
  - configuracion de umbrales
  - visualizacion de logs
- Exportacion mock de informe en PDF y CSV.
- Manejo de estados `idle`, `loading`, `success`, `empty` y `error`.
- Tema visual corporativo sobrio y responsive orientado a escritorio.
- Migracion del MVP desde Angular a React para unificar el stack final del frontend.

## Estructura creada
```text
ers-frontend/
  src/
    components/
      layout/
      shared/
    features/
      admin/
      auth/
      dashboard/
      errors/
    mocks/
    models/
    router/
    services/
    state/
    theme/
    utils/
```

## Pantallas implementadas
- Login
- Dashboard antifraude
- Admin de umbrales
- Admin de logs
- Acceso denegado
- Ruta no encontrada

## Componentes compartidos implementados
- `AppShell`
- `SearchBar`
- `KpiCard`
- `SectionCard`
- `StatusState`
- `AlertChips`
- `ScoreGauge`
- `RiskHeatmap`
- `RelationshipNetwork`
- `DataTable`
- `ExportActions`
- `PageHeader`

## Modelos definidos
- `User`
- `Role`
- `SessionState`
- `LoginRequest`
- `SearchIdentifier`
- `IdentifierType`
- `ApiState<T>`
- `PersonProfile`
- `FinancialProfile`
- `EmploymentFiscalProfile`
- `ClaimHistoryItem`
- `RiskAlert`
- `RiskScoreExplanation`
- `RiskHeatmapCell`
- `RelationshipNode`
- `RelationshipEdge`
- `RiskEvaluation`
- `RiskThresholdConfig`
- `AuditLogEntry`

## Rutas principales
- `/login`
- `/dashboard`
- `/admin/thresholds`
- `/admin/logs`
- `/access-denied`

## Roles contemplados
- Administrador
- Evaluador de Riesgos
- Supervisor

## Datos mock incluidos
- Usuarios demo con rol.
- Evaluaciones de riesgo por identificador.
- Configuracion inicial de umbrales.
- Logs de auditoria simulados.

## Credenciales demo
- `admin / Admin#123`
- `evaluador / Eval#123`
- `supervisor / Super#123`

## Validacion realizada
- Instalacion de dependencias con `npm.cmd install`.
- Build exitoso con `npm.cmd run build`.

## Pendientes para siguientes sprints
- Integracion real con backend .NET REST.
- Persistencia real de sesion.
- Exportacion PDF real con libreria dedicada.
- Graficos mas avanzados para heatmap y red de relaciones.
- Filtros, paginacion y auditoria ampliada.
- Tests unitarios y de integracion.

## Stack final del sprint
- React
- TypeScript
- Vite
- MUI
- React Router DOM
