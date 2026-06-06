# Documentacion General del Frontend ERS

## 1. Resumen ejecutivo

El frontend actual corresponde a un sistema web de evaluacion antifraude para seguros llamado **ERS - Evaluador de Riesgos de Seguros**.

Su objetivo es permitir que usuarios de negocio consulten un identificador (`DNI`, `CUIL`, `CUIT`), obtengan una evaluacion antifraude consolidada del caso y operen sobre ese resultado mediante:

- visualizacion de score de riesgo
- alertas antifraude
- explicabilidad del modelo
- historial de siniestros
- grafo de relaciones
- exportaciones
- auditoria
- configuracion administrativa
- resolucion manual del caso (`aceptar` / `denegar`) en flujo mock

El proyecto hoy esta **avanzado a nivel UI/UX y contratos TypeScript**, pero todavia trabaja mayormente con **mocks en memoria**. El valor principal actual del frontend es servir como base funcional y visual para la integracion con backend real.

## 2. Objetivo del producto

El sistema busca centralizar la evaluacion antifraude de expedientes de seguros, integrando multiples fuentes y mostrando un dashboard unico para analistas, supervisores y administradores.

Casos de uso principales:

- iniciar sesion segun rol
- buscar una persona o empresa por identificador
- evaluar si el caso es normal, requiere revision o es sospechoso de fraude
- inspeccionar alertas y explicaciones del score
- revisar relaciones y antecedentes
- exportar informes
- auditar accesos, consultas y acciones
- administrar reglas, umbrales e integraciones

## 3. Estado actual del frontend

El frontend ya implementa:

- autenticacion mock con roles
- control de acceso por rutas
- busqueda y evaluacion mock
- dashboard detallado de caso
- accion mock para aceptar o denegar casos no normales
- exportacion mock CSV/PDF
- modulo de auditoria con filtros, ordenamiento y exportacion CSV
- panel administrativo con formularios y persistencia mock
- layout general responsive con navegacion lateral
- mapa lateral visual de riesgo geografico

El frontend todavia no implementa:

- integracion HTTP real con backend
- JWT real, refresh token y expiracion server-driven
- auditoria real de login, exportaciones y decisiones
- persistencia real de casos, resoluciones y configuraciones
- generacion PDF real
- control de permisos desde backend
- contratos OpenAPI compartidos

## 4. Stack tecnico

### Tecnologias

- `React 18`
- `TypeScript`
- `Vite`
- `Material UI`
- `React Router DOM`
- `React Hook Form`
- `Zod`
- `Leaflet` + `react-leaflet`

### Scripts disponibles

- `npm start`
- `npm run build`
- `npm run preview`

### Caracteristicas tecnicas del frontend

- aplicacion SPA
- tipado fuerte de modelos de dominio
- arquitectura por `features`
- servicios desacoplados del render
- mocks en memoria para simular backend
- layout responsive desktop/mobile

## 5. Arquitectura general

### Punto de entrada

- `ers-frontend/src/main.tsx`
- monta `ThemeProvider`, `CssBaseline`, `BrowserRouter` y `AppProviders`

### App root

- `ers-frontend/src/App.tsx`
- delega completamente al `RouterProvider`

### Providers globales

- `ers-frontend/src/state/AppProviders.tsx`
- actualmente solo envuelve `AuthProvider`

### Ruteo

Archivo principal:

- `ers-frontend/src/router/RouterProvider.tsx`

Rutas implementadas:

- `/login`
- `/search`
- `/cases/:caseId`
- `/audit/logs`
- `/admin`
- `/access-denied`

Redirecciones:

- `/` redirige a `/search`
- `/dashboard` redirige a `/search`
- `/dashboard/:identifier` redirige a `/search`
- `/admin/logs` redirige a `/audit/logs`

### Proteccion de rutas

Archivo:

- `ers-frontend/src/router/ProtectedRoute.tsx`

Comportamiento:

- si no hay sesion autenticada, redirige a `/login`
- si el usuario no tiene rol suficiente, muestra `AccessDeniedPage`

## 6. Roles y permisos

Roles definidos:

- `Administrador`
- `Supervisor`
- `Evaluador de Riesgos`

Acceso por modulo:

- `Login`: todos
- `Busqueda`: cualquier usuario autenticado
- `Dashboard de caso`: cualquier usuario autenticado
- `Auditoria`: `Administrador` y `Supervisor`
- `Panel admin`: solo `Administrador`

Credenciales demo actuales:

- `admin / Admin#123`
- `supervisor / Super#123`
- `evaluador / Eval#123`

## 7. Layout y experiencia de usuario

### Layout principal

Archivo:

- `ers-frontend/src/components/layout/AppShell.tsx`

Incluye:

- `AppBar` superior
- `Drawer` lateral responsive
- breadcrumbs
- avatar y rol del usuario
- acceso a mapa de riesgo geografico
- boton de logout

Navegacion lateral visible segun permisos:

- `Busqueda`
- `Dashboard ejemplo`
- `Auditoria` si el rol lo permite
- `Panel admin` si el rol lo permite

### Tema visual

Archivo:

- `ers-frontend/src/theme/appTheme.ts`

Lineamientos actuales:

- identidad azul institucional
- bordes redondeados amplios
- cards con sombra suave
- tipografia basada en `Segoe UI Variable`, `Bahnschrift`, `IBM Plex Sans`

## 8. Modulos funcionales

### 8.1 Autenticacion

Archivos principales:

- `src/features/auth/LoginPage.tsx`
- `src/state/AuthContext.tsx`
- `src/services/authService.ts`
- `src/models/auth.ts`
- `src/mocks/authMock.ts`

Funcionamiento actual:

- login mock por usuario y password
- sesion almacenada en `localStorage`
- expiracion mock a 30 minutos
- aviso de expiracion via `sessionStorage`
- chequeo de roles desde frontend

Limitaciones:

- no hay JWT real
- no hay refresh token
- no hay auditoria real de login/logout

### 8.2 Busqueda y evaluacion

Archivos principales:

- `src/features/search/SearchPage.tsx`
- `src/features/search/components/SearchForm.tsx`
- `src/features/search/components/RecentSearchesCard.tsx`
- `src/features/search/components/DailyLimitIndicator.tsx`
- `src/features/search/hooks/useSearchFlow.ts`
- `src/services/searchService.ts`
- `src/models/search.ts`
- `src/utils/identifier.ts`
- `src/mocks/searchMock.ts`

Capacidades actuales:

- validacion de identificadores `DNI`, `CUIL`, `CUIT`
- consulta mock de evaluacion
- outcomes soportados:
  - `found`
  - `not_found`
  - `deceased`
  - `insufficient_data`
  - `integration_error`
- busquedas recientes por usuario
- limite diario mock de consultas
- apertura del dashboard cuando el caso aplica

Casos demo visibles desde la UI:

- `20333444556` -> Normal
- `27123456789` -> Requiere revision
- `30111222` -> Sospechoso
- `27222333444` -> Fallecido
- `27999888776` -> No evaluable

### 8.3 Dashboard del caso

Archivos principales:

- `src/features/cases/CaseDashboardPage.tsx`
- `src/services/caseService.ts`
- `src/models/cases.ts`
- `src/mocks/casesMock.ts`

Componentes relevantes:

- `CaseStatusBanner`
- `CaseHeaderSummary`
- `CaseDecisionCard`
- `RiskScoreCard`
- `AlertsPanel`
- `AIExplanationPanel`
- `RiskHeatmapCard`
- `RelationshipGraphCard`
- `FinancialInfoCard`
- `LaborFiscalCard`
- `ClaimsHistoryCard`
- `ExportActionsCard`

Informacion mostrada en el dashboard:

- estado general del caso
- score y categoria de riesgo
- resumen del analista
- alertas antifraude
- explicacion ejecutiva del modelo
- variables influyentes
- heatmap de riesgo
- grafo de relaciones
- informacion personal
- informacion financiera
- informacion laboral y fiscal
- historial de siniestros

Categorias de riesgo actuales:

- `Normal`
- `Requiere revision`
- `Sospechoso de fraude`

Estados generales de caso:

- `Evaluable`
- `Fallecido`
- `No evaluable`
- `En revision prioritaria`

### 8.4 Resolucion manual de casos

Estado actual:

- implementada en frontend como flujo mock

Archivos:

- `src/features/cases/components/CaseDecisionCard.tsx`
- `src/services/caseService.ts`
- `src/models/cases.ts`

Comportamiento:

- si el caso no es `Normal`, se muestran acciones de:
  - `Aceptar caso`
  - `Denegar caso`
- la resolucion se guarda en memoria del servicio mock
- el estado de resolucion puede ser:
  - `Pendiente`
  - `Aceptado`
  - `Denegado`
- se muestra feedback visual mediante `Snackbar`

Limitaciones:

- no existe endpoint real
- no hay auditoria backend de la decision
- no existe cambio posterior de decision
- no hay workflow con comentario obligatorio, motivo o doble aprobacion

### 8.5 Exportaciones

Archivos principales:

- `src/features/cases/components/ExportActionsCard.tsx`
- `src/features/cases/components/ExportButtonGroup.tsx`
- `src/services/exportService.ts`
- `src/models/export.ts`

Capacidades:

- exportacion mock a `CSV`
- exportacion mock a `PDF`
- generacion de nombre de archivo
- descarga local en navegador

Contenido mock exportado:

- datos del caso
- score IA
- resultado
- alertas
- resumen ejecutivo
- timestamp
- bandera de firma digital futura

Limitaciones:

- el PDF no es un PDF real documental
- no hay firma digital
- no se registra evidencia real de descarga

### 8.6 Auditoria

Archivos principales:

- `src/features/audit/AuditLogsPage.tsx`
- `src/features/audit/components/AuditLogFilters.tsx`
- `src/features/audit/components/AuditLogsTable.tsx`
- `src/features/audit/components/AuditLogDetailDialog.tsx`
- `src/services/auditService.ts`
- `src/models/audit.ts`
- `src/mocks/auditMock.ts`

Capacidades actuales:

- consulta mock de logs
- filtros por:
  - usuario
  - rol
  - fecha desde/hasta
  - accion
  - resultado
- ordenamiento por columnas
- paginacion client-side
- modal de detalle
- exportacion CSV del resultado visible

Tipos de accion auditables hoy:

- `Login`
- `Logout`
- `Consulta de riesgo`
- `Exportacion CSV`
- `Exportacion PDF`
- `Actualizacion de umbrales`
- `Cambio de parametros`
- `Revision manual`

Resultados posibles:

- `OK`
- `Observado`
- `Bloqueado`
- `Error`

Limitaciones:

- todo corre en memoria
- no hay consulta server-side
- no hay trazabilidad tecnica por correlacion o request id

### 8.7 Panel administrativo

Archivos principales:

- `src/features/admin/AdminPage.tsx`
- `src/services/adminService.ts`
- `src/models/admin.ts`
- `src/mocks/adminMock.ts`

Submodulos implementados:

- configuracion de umbrales de riesgo
- resumen de reglas activas
- alta de nuevas reglas
- alta de integraciones
- estado de integraciones
- parametros generales del sistema
- configuracion de exportaciones

Campos configurables actuales:

- umbral de revision manual
- umbral de rechazo automatico
- frecuencia sospechosa de siniestros
- debt ratio threshold
- peso por pais de alto riesgo
- timeout de sesion
- email de incidentes
- retencion de auditoria
- modo mantenimiento
- habilitacion de CSV/PDF
- inclusion de datos sensibles
- aprobacion requerida para exportaciones
- maximo de filas por exportacion

Persistencia actual:

- mock en memoria con timestamps y `updatedBy`

Limitaciones:

- sin backend real
- sin versionado historico persistente
- permisos solo frontend

## 9. Modelos de dominio principales

### Sesion y usuario

- `User`
- `SessionState`
- `Role`

### Busqueda

- `SearchRequest`
- `SearchResponse`
- `RecentSearch`
- `IdentifierValidationResult`

### Caso

- `CaseEvaluation`
- `RiskScore`
- `FraudAlert`
- `AIExplanation`
- `RiskVariableImpact`
- `PersonalInfo`
- `FinancialInfo`
- `LaborFiscalInfo`
- `ClaimRecord`
- `CaseResolution`

### Auditoria

- `AuditLogEntry`
- `AuditLogFilter`
- `AuditLogQuery`
- `AuditLogPage`

### Administracion

- `RiskThresholdConfig`
- `ActiveRule`
- `IntegrationStatus`
- `SystemSetting`
- `ExportSetting`
- `AdminPanelData`

## 10. Estructura de carpetas relevante

```text
ers-frontend/
  src/
    components/
      layout/
      shared/
    features/
      auth/
      search/
      cases/
      audit/
      admin/
      errors/
    mocks/
    models/
    router/
    services/
    state/
    theme/
    utils/
```

Descripcion:

- `components/layout`: layout global, breadcrumbs, drawer, mapa
- `components/shared`: bloques reutilizables comunes
- `features/*`: modulos por funcionalidad
- `mocks`: datos simulados
- `models`: contratos TypeScript
- `services`: logica de acceso a datos y simulacion backend
- `state`: providers y contexto global
- `theme`: look and feel global
- `utils`: utilidades de validacion y normalizacion

## 11. Flujos funcionales actuales

### Flujo 1: login

1. el usuario ingresa credenciales demo
2. `authService` valida contra `mockUsers`
3. se guarda sesion en `localStorage`
4. se redirige a `/search`

### Flujo 2: busqueda

1. el usuario ingresa `DNI`, `CUIL` o `CUIT`
2. se valida formato
3. `searchService.evaluateIdentifier` simula consulta
4. si el caso es abrible, se navega al dashboard
5. se actualizan busquedas recientes y cupo diario

### Flujo 3: analisis de caso

1. se consulta `caseService.getCaseById`
2. se renderiza el dashboard consolidado
3. el usuario inspecciona score, alertas y explicabilidad
4. puede exportar el informe
5. si el caso no es normal, puede aceptar o denegar en mock

### Flujo 4: auditoria

1. un usuario con permiso ingresa a `/audit/logs`
2. aplica filtros y ordenamiento
3. revisa detalle de evento
4. puede exportar a CSV lo visible

### Flujo 5: administracion

1. un administrador accede a `/admin`
2. modifica umbrales, reglas, integraciones o parametros
3. los cambios quedan persistidos en memoria
4. la UI informa exito/error

## 12. Integraciones backend necesarias

El frontend esta preparado para migrar de mocks a adaptadores HTTP. Las integraciones minimas necesarias son:

### Autenticacion

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Busqueda y evaluacion

- `POST /cases/evaluate`
- `GET /cases/{caseId}`
- `GET /search/recent`
- `GET /usage/daily`

### Resolucion de caso

- `POST /cases/{caseId}/decision`
- payload sugerido:
  - decision: `accept` | `deny`
  - comment
  - actorId

### Exportaciones

- `POST /cases/{caseId}/exports/pdf`
- `POST /cases/{caseId}/exports/csv`
- `GET /exports/{exportId}`

### Auditoria

- `GET /audit/logs`
- filtros server-side
- ordenamiento server-side
- paginacion server-side
- exportacion total

### Administracion

- `GET /admin/config`
- `PUT /admin/thresholds`
- `PUT /admin/system-settings`
- `PUT /admin/export-settings`
- `POST /admin/rules`
- `POST /admin/integrations`

## 13. Mocks existentes y su valor

Los mocks actuales no son solo datos de prueba. Cumplen cuatro funciones:

- fijan contratos de datos para backend futuro
- permiten demo funcional del producto
- sirven como base de testing visual/manual
- ayudan a diseñar historias de usuario y criterios de aceptacion

Areas mock existentes:

- usuarios
- busquedas recientes
- resultados de busqueda
- casos consolidados
- auditoria
- configuracion administrativa

## 14. Limitaciones, deuda tecnica y riesgos

### Limitaciones funcionales

- sin persistencia real
- sin seguridad real
- sin backend transaccional
- sin multiusuario real
- sin sincronizacion entre navegadores

### Limitaciones tecnicas

- estado mock almacenado en memoria/localStorage
- sin tests automatizados visibles en frontend
- sin cliente HTTP ni capa de errores global
- sin manejo de loading/error centralizado por API
- bundle de build relativamente grande

### Riesgos para proyecto general

- si backend define contratos diferentes a los modelos actuales, habra refactor
- la auditoria puede requerir rediseño si se vuelve de alta escala
- la resolucion manual de casos todavia no contempla workflow operativo real
- el frontend hoy no expresa estados de concurrencia, lock de caso ni versionado

## 15. Oportunidades claras para roadmap

### Corto plazo

- integrar autenticacion real
- integrar evaluacion y detalle de caso
- conectar resolucion manual a backend
- unificar manejo de errores HTTP
- persistir auditoria real

### Mediano plazo

- versionar configuracion administrativa
- agregar comentarios y motivos de resolucion
- implementar exportaciones reales
- incorporar tests unitarios y de integracion
- definir DTOs/OpenAPI compartidos

### Largo plazo

- dashboards operativos y KPIs
- workflow colaborativo entre analista y supervisor
- asignacion de casos
- colas y priorizacion
- notificaciones
- firma digital y evidencia documental

## 16. Recomendaciones para planificar sprints del programa completo

Para diseñar sprints del sistema general, conviene pensar en estas epicas:

- identidad y seguridad
- busqueda y orquestacion de evaluacion
- dashboard antifraude
- resolucion operativa del caso
- auditoria y trazabilidad
- administracion y reglas
- integraciones externas
- exportaciones y evidencia documental
- calidad, testing y observabilidad
- despliegue e infraestructura

Dependencias importantes:

- autenticacion real impacta todo
- contratos de caso impactan dashboard, exportaciones, auditoria y decisiones
- auditoria debe definirse temprano para no perder trazabilidad
- reglas y umbrales administrativos dependen del modelo antifraude y backend de configuracion

## 17. Prompt sugerido para pedirle a ChatGPT el plan de sprints

Podes pasarle este documento a ChatGPT junto con este prompt:

```text
Quiero que actues como Product Manager + Tech Lead y me diseñes el plan completo de sprints para construir este sistema antifraude a partir de la documentacion adjunta.

Necesito que me devuelvas:
1. Una propuesta de epicas.
2. Un plan de sprints secuencial.
3. Objetivo de cada sprint.
4. Historias de usuario por sprint.
5. Dependencias entre historias.
6. Riesgos y supuestos.
7. Entregables funcionales y tecnicos.
8. Criterios de aceptacion de alto nivel.
9. Priorizacion MVP vs post-MVP.
10. Recomendaciones de arquitectura para backend, frontend, datos, auditoria y seguridad.

Contexto:
- El frontend ya existe en React + TypeScript + Vite + MUI.
- Hoy funciona principalmente con mocks.
- El sistema necesita backend real, autenticacion, auditoria, integraciones, reglas de negocio, resolucion de casos y exportaciones.
- Quiero que el plan sea realista para un equipo pequeno o mediano.

Ademas:
- separa trabajo funcional, tecnico y de infraestructura
- proponeme entre 8 y 12 sprints
- identifica quick wins
- marca que partes deben resolverse antes por definicion funcional
```

## 18. Conclusión

El frontend ya materializa gran parte del producto desde el punto de vista de experiencia, navegacion, contratos y modulos operativos. Eso permite usarlo como base fuerte para planificar el programa completo.

La prioridad del siguiente nivel ya no es de interfaz sino de **integracion, persistencia, seguridad, auditoria y definicion operativa del workflow real**.
