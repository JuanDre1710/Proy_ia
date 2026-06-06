# Sprint 02 - Backend IA

## Dirigido a
Backend y administración de integraciones del sistema ERS.

## Objetivo del sprint
Implementar la gestión dinámica de integraciones externas usando la pantalla Admin existente, evitando hardcodear proveedores y configuraciones, y dejando la base preparada para conectar múltiples fuentes externas sin acoplar dominio ni frontend.

## Alcance implementado

### Backend

- Se extendió el modelo canónico `IntegrationConfig` para soportar:
  - `integration_id`
  - `provider_code`
  - `provider_type`
  - `display_name`
  - `base_url`
  - `auth_type`
  - `secret_ref`
  - `timeout_ms`
  - `retries`
  - `status`
  - `enabled`
  - `metadata`
  - `settings`
- Se implementó `IntegrationManager` como servicio de aplicación para:
  - listar integraciones
  - listar integraciones activas
  - crear integraciones
  - actualizar integraciones
  - habilitar/deshabilitar integraciones
  - resolver adapter por integración
  - testear conectividad básica
- Se creó una factory de adapters por tipo de integración.
- Se agregaron adapters base para conectividad:
  - HTTP genérico
  - Webhook
  - Batch
  - Base de datos
- Se agregó persistencia simple en archivo JSON para integraciones.
- Se agregó persistencia de auditoría en JSONL para acciones críticas sobre integraciones.
- Se expusieron endpoints FastAPI para CRUD y test de conectividad.

### Frontend

- La `AdminPage` existente quedó conectada al backend real para integraciones.
- Se mantuvo compatibilidad temporal con mocks si el backend no responde.
- Se amplió el formulario existente para integraciones con:
  - código técnico
  - provider type
  - timeout
  - retries
  - enabled
  - secret ref abstracta
  - metadata JSON
- Se agregó soporte de edición de integraciones.
- Se agregó toggle de habilitación/deshabilitación.
- Se agregó acción de prueba de conectividad.

## Estructura impactada

```text
Documentacion/
  Sprint-02-Backend-IA.md
data/
  integration_configs.json
ers_core/
  domain/
    models.py
  application/
    ports/
      integration_repository.py
    services/
      integration_manager.py
  adapters/
    factories/
      integration_adapter_factory.py
    providers/
      base.py
    repositories/
      file_integration_repository.py
      file_audit_log_repository.py
ia_fraude/
  app.py
  api/
    integration_routes.py
    integration_schemas.py
ers-frontend/
  src/
    models/
      admin.ts
    services/
      adminService.ts
    features/
      admin/
        AdminPage.tsx
        components/
          AddIntegrationCard.tsx
          IntegrationStatusCard.tsx
```

## Endpoints agregados

- `GET /admin/integrations`
- `GET /admin/integrations/active`
- `GET /admin/integrations/{integrationId}`
- `POST /admin/integrations`
- `PUT /admin/integrations/{integrationId}`
- `PATCH /admin/integrations/{integrationId}/enabled`
- `POST /admin/integrations/{integrationId}/test-connectivity`
- `DELETE /admin/integrations/{integrationId}`

## Decisiones técnicas

- Se mantuvo una separación estricta entre:
  - configuración de integración
  - adapters externos
  - dominio canónico
  - modelos UI
- `IntegrationConfig` vive como modelo de infraestructura/configuración del sistema y no como payload acoplado a un proveedor externo.
- Las credenciales no se almacenan como secreto crudo en el frontend ni en el dominio funcional; se usa `secret_ref` como abstracción.
- Se usó persistencia en archivo para este sprint porque el objetivo era habilitar configuración dinámica, no cerrar almacenamiento productivo.
- El frontend conserva fallback a mocks para no bloquear la migración.
- La conectividad básica se definió como prueba técnica de disponibilidad/configuración, no como ejecución de lógica de negocio del caso.

## Qué deberías poder notar ahora

### En la pantalla Admin

Deberías poder notar que el módulo de integraciones ahora permite:

- cargar integraciones con más parámetros técnicos
- editar una integración existente
- deshabilitar o habilitar una integración
- ejecutar una prueba de conectividad
- ver reflejado el estado operativo y la habilitación

### En el backend

Deberías notar:

- un archivo `data/integration_configs.json` donde se persisten integraciones
- un archivo `data/audit_logs.jsonl` que se crea cuando se ejecutan acciones críticas
- endpoints nuevos bajo `/admin/integrations`

## Cómo probarlo manualmente

### Backend

1. Levantar el backend FastAPI desde `ia_fraude/app.py`
2. Abrir la documentación de FastAPI
3. Probar:
   - `POST /admin/integrations`
   - `GET /admin/integrations`
   - `PATCH /admin/integrations/{id}/enabled`
   - `POST /admin/integrations/{id}/test-connectivity`

Resultado esperado:

- la integración se crea
- aparece listada
- cambia su estado `enabled`
- queda registrado el último test en metadata

### Frontend

1. Levantar el frontend
2. Iniciar sesión como `admin`
3. Ir a `/admin`
4. En “Alta de integraciones externas”, crear una integración
5. Verificar que aparezca en “Estado de integraciones”
6. Editarla
7. Probar conectividad
8. Deshabilitarla y volver a habilitarla

Resultado esperado:

- el formulario guarda cambios
- el listado se actualiza
- la prueba devuelve feedback visual
- el toggle cambia el estado de la tarjeta

## Validación realizada

- `compileall` sobre `ers_core` e `ia_fraude`: OK
- `npm.cmd run build` en `ers-frontend`: OK

## Validación no realizada

- No se pudo ejecutar un smoke test con `fastapi.testclient` en este entorno porque el intérprete activo no tiene `fastapi` instalado.

## Restricciones respetadas

- No se tocó la UI fuera de ajustes mínimos en la pantalla Admin existente.
- No se hardcodearon endpoints externos ni credenciales reales en código de negocio.
- No se acopló el frontend al payload crudo de proveedores.
- No se implementó lógica de negocio del caso sobre proveedores.
- Se dejó la base lista para auditoría de acciones críticas.

## Deuda pendiente / siguiente paso

- Reemplazar persistencia en archivo por repositorio real.
- Definir almacenamiento seguro real de secretos.
- Agregar health checks más robustos por tipo de proveedor.
- Exponer contratos OpenAPI definitivos para frontend.
- Integrar estas configuraciones con la futura orquestación de evaluación del caso.
