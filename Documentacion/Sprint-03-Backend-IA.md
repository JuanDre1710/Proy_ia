# Sprint 03 - Backend IA

## Dirigido a
Autenticación, sesión y seguridad de acceso del sistema ERS.

## Objetivo del sprint
Reemplazar el login mock por autenticación real sin cambiar la UX actual del frontend, manteniendo guards y navegación existentes, y conservando los usuarios demo para no bloquear el ingreso durante la migración.

## Alcance implementado

### Backend de autenticación

Se implementaron endpoints reales:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Se agregó soporte para:

- access token firmado tipo JWT
- refresh token rotativo
- expiración de sesión
- roles reales:
  - `Admin`
  - `Supervisor`
  - `Evaluador`
- auditoría preparada para login y logout

### Persistencia y seguridad

Se agregaron repositorios de archivo para:

- usuarios autenticables
- refresh tokens
- auditoría

Se implementó:

- hash de contraseña con `pbkdf2_hmac`
- validación de password
- firma y validación de JWT con HMAC SHA-256
- revocación de refresh token en logout y rotación en refresh

### Frontend

Se reemplazó el `authService` mock por un servicio híbrido:

- intenta autenticación real contra backend
- si el backend no responde, mantiene fallback a usuarios mock

Se mantuvieron sin rediseño:

- `LoginPage`
- `ProtectedRoute`
- flujo de navegación
- roles de UI:
  - `Administrador`
  - `Supervisor`
  - `Evaluador de Riesgos`

Se agregó:

- manejo real de sesión en `localStorage`
- refresh automático de sesión
- cierre de sesión real
- chequeo de `/auth/me`
- compatibilidad entre roles backend y roles frontend mediante adapter

## Estructura impactada

```text
Documentacion/
  Sprint-03-Backend-IA.md
data/
  auth_refresh_tokens.json
ers_core/
  application/
    ports/
      auth_repository.py
    services/
      auth_manager.py
  adapters/
    repositories/
      file_auth_user_repository.py
      file_refresh_token_repository.py
  security/
    jwt_utils.py
    passwords.py
ia_fraude/
  app.py
  api/
    auth_routes.py
    auth_schemas.py
ers-frontend/
  src/
    services/
      authService.ts
    state/
      AuthContext.tsx
    router/
      ProtectedRoute.tsx
    features/
      auth/
        LoginPage.tsx
```

## Decisiones técnicas

- Se mantuvo el login visualmente igual para respetar la UX actual.
- El backend usa roles canónicos (`Admin`, `Supervisor`, `Evaluador`) y el frontend los adapta a sus labels actuales.
- Se dejó activo el fallback a mocks por pedido explícito, para no bloquear la demo.
- Los usuarios demo siguen vigentes:
  - `admin / Admin#123`
  - `supervisor / Super#123`
  - `evaluador / Eval#123`
- El refresh token se rota y se revoca en logout.
- El `authService` del frontend soporta sesiones `real` y `mock`.

## Qué deberías poder notar ahora

### En la UI

No deberías notar un rediseño del login.

Sí deberías notar:

- el botón puede mostrar estado `Ingresando...`
- el login sigue aceptando `admin`, `supervisor` y `evaluador`
- la navegación y los guards siguen funcionando igual

### A nivel comportamiento

Si el backend está levantado:

- el login se resuelve contra `/auth/login`
- la sesión usa tokens reales
- el frontend puede refrescar sesión
- `/auth/me` valida al usuario autenticado

Si el backend no está disponible:

- el frontend sigue permitiendo ingresar con los usuarios demo vía fallback mock

### A nivel archivos

Deberías notar que aparecen o se actualizan:

- `data/auth_refresh_tokens.json`
- `data/audit_logs.jsonl`
- `data/auth_users.json` cuando el repositorio de usuarios se inicializa por primera vez

## Cómo probarlo manualmente

### Escenario 1: backend disponible

1. Levantar el backend
2. Levantar el frontend
3. Iniciar sesión con:
   - `admin / Admin#123`
4. Abrir navegación protegida
5. Refrescar la página
6. Verificar que la sesión se mantenga
7. Cerrar sesión

Resultado esperado:

- login exitoso
- acceso a rutas protegidas
- sesión persistida
- logout efectivo

### Escenario 2: backend caído

1. No levantar el backend
2. Levantar el frontend
3. Iniciar sesión con cualquiera de los usuarios demo

Resultado esperado:

- se puede seguir ingresando
- el flujo usa fallback mock

## Validación realizada

- `compileall` sobre `ers_core` e `ia_fraude`: OK
- smoke test del `AuthManager`:
  - login: OK
  - `me`: OK
  - refresh: OK
  - logout: OK
- `npm.cmd run build` en frontend: OK

## Restricciones respetadas

- No se cambió la UX del login.
- No se rompieron los guards existentes.
- Se dejó auditoría preparada para login/logout.
- Se mantuvieron activos los usuarios mock para demo y continuidad operativa.

## Deuda pendiente / siguiente paso

- mover secreto JWT a configuración segura obligatoria en despliegue real
- reemplazar persistencia en archivo por almacenamiento real
- endurecer políticas de expiración, revocación y refresh por dispositivo
- registrar auditoría más rica con correlación y contexto
- exponer manejo global de errores 401/403 en frontend
