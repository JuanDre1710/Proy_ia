# Final Demo Runbook

## Objetivo
Ejecutar y mostrar la demo final del sistema ERS con flujo completo de punta a punta usando solo fuentes demo internas.

## Alcance demo
La demo cubre:
- login
- busqueda y creacion del caso
- enrichment demo interno
- reglas duras
- reasoning demo
- scoring tabular demo
- evaluacion final
- resolucion manual
- auditoria

No cubre integraciones productivas ni decision automatica real.

## Escenarios recomendados
### 1. Caso normal
- Identificador: `27123456789`
- Resultado esperado:
  - score `NORMAL`
  - estado final `READY_FOR_DECISION`
  - reasoning y scoring disponibles

### 2. Caso con revision
- Identificador: `30111205`
- Resultado esperado:
  - score `REQUIRES_REVIEW`
  - estado final `REVIEW_REQUIRED`
  - se recomienda cierre manual con comentario

### 3. Caso sospechoso
- Identificador: `30111201`
- Resultado esperado:
  - score `FRAUD_SUSPECT`
  - estado final `REVIEW_REQUIRED`
  - mostrar escalado manual y auditoria

### 4. Caso con datos incompletos
- Identificador: `30111297`
- Resultado esperado:
  - estado `not_evaluable`
  - sin scoring
  - evaluacion final `NOT_EVALUABLE`

### 5. Caso con inconsistencias
- Identificador: `30111277`
- Resultado esperado:
  - estado `excluded`
  - inconsistencia critica entre fuentes
  - evaluacion final `EXCLUDED`

## Como correr la demo
### Backend
1. Configurar entorno Python del proyecto.
2. Levantar la API:
```powershell
venv\Scripts\python.exe -m uvicorn ia_fraude.app:create_app --factory --reload
```

### Frontend
1. Ir a `ers-frontend`.
2. Usar backend demo como fuente primaria:
```powershell
npm.cmd install
npm.cmd start
```
3. Si hace falta, definir:
```text
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_DEMO_BACKEND_SEARCH=true
VITE_USE_DEMO_BACKEND_CASES=true
VITE_USE_DEMO_BACKEND_CASE_DECISION=true
```

## Credenciales demo
- `admin / Admin#123`
- `supervisor / Super#123`
- `evaluador / Eval#123`

Para mostrar auditoria y configuracion conviene usar `supervisor` o `admin`.

## Secuencia sugerida de presentacion
1. Iniciar sesion como `supervisor`.
2. Mostrar la pantalla de busqueda con los cinco identificadores de referencia.
3. Abrir `27123456789` y remarcar:
   - consolidacion del caso
   - reasoning
   - score
   - evaluacion final
4. Abrir `30111205` y remarcar:
   - riesgo intermedio
   - recomendacion de revision
5. Abrir `30111201` y ejecutar resolucion manual:
   - comentario obligatorio
   - accion `Escalar caso`
   - persistencia de la decision
6. Ir a auditoria y mostrar:
   - `Consulta de riesgo`
   - `Revision manual`
7. Si hace falta mostrar limites del pipeline:
   - `30111297` para no evaluable
   - `30111277` para inconsistencia/exclusion

## Validacion automatizada
### Smoke general del pipeline
```powershell
venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py
```

### Validacion final de escenarios demo
```powershell
venv\Scripts\python.exe ia_fraude\demo_final_validation.py
```

### Build del frontend
```powershell
cd ers-frontend
npm.cmd run build
```

## Mensajes clave para la demo
- Las fuentes actuales son internas y sinteticas.
- El flujo operativo ya es real dentro de la demo.
- La decision manual queda persistida y auditada.
- El frontend no trabaja solo con mocks para el flujo principal.

## Gaps para etapa futura con integraciones reales
- proveedores externos reales y SLAs
- autenticacion y autorizacion productivas
- auditoria fuerte e inmutable
- observabilidad distribuida y trazabilidad cross-service
- calibracion y entrenamiento real del modelo
- explainability mas rica y gobernanza de modelo
- workflow multiusuario con locks, reasignacion y versionado
