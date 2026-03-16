# Frontend TODOs Para Backend Real

## Autenticacion y sesion
- Reemplazar `authService` mock por autenticacion real con token y refresh token.
- Mover expiracion de sesion a claims del backend o expiracion JWT real.
- Registrar auditoria real de login, logout y expiracion.

## Busqueda y evaluacion
- Reemplazar `searchService` y `caseService` por endpoints reales de evaluacion y detalle de caso.
- Normalizar codigos de error de negocio e integracion para mensajes uniformes en UI.
- Persistir busquedas recientes y limites diarios desde backend.

## Panel administrativo
- Conectar `adminService` a endpoints de configuracion, reglas e integraciones.
- Versionar cambios administrativos y mostrar historial real de auditoria.
- Validar permisos por recurso desde backend, no solo por rol en frontend.

## Auditoria
- Reemplazar `auditService` por consulta paginada server-side con filtros y ordenamiento reales.
- Soportar exportacion completa de logs desde backend.
- Incorporar identificadores tecnicos de trazabilidad y correlacion.

## Exportaciones
- Generar PDF real en backend o servicio documental dedicado.
- Firmar digitalmente informes cuando la capacidad este disponible.
- Registrar evidencia de descarga y aprobaciones reales en auditoria.

## Integracion general
- Consolidar contratos TypeScript a partir de schemas OpenAPI o DTOs compartidos.
- Reemplazar mocks por adaptadores HTTP manteniendo la misma interfaz de services.
- Agregar manejo global de errores HTTP, reintentos y telemetry.
