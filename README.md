# ERS - Backend IA

Backend de evaluacion antifraude con pipeline completo:

- ingesta
- normalizacion
- reglas duras
- reasoning
- scoring
- fusion final
- decision manual
- auditoria
- exportaciones

## Requisitos

- Python 3.13
- Node.js 18+ para el frontend
- entorno virtual en `venv`

## Configuracion

Copiar variables desde `.env.example`.

Variables principales:

- `ERS_ENV`
- `ERS_DATA_DIR`
- `ERS_EXPORT_DIR`
- `ERS_JWT_SECRET`
- `ERS_CORS_ORIGINS`
- `ERS_RATE_LIMIT_REQUESTS`
- `ERS_RATE_LIMIT_WINDOW_SECONDS`
- `ERS_LOG_LEVEL`
- `ERS_STRUCTURED_LOGS`
- `ERS_ENABLE_MODEL_WATCHER`

En produccion no debe usarse el secreto JWT por defecto.

## Levantar backend

```powershell
venv\Scripts\python.exe -m uvicorn ia_fraude.app:app --host 0.0.0.0 --port 8000
```

Swagger:

- `http://localhost:8000/docs`

## Levantar frontend

```powershell
cd ers-frontend
npm.cmd install
npm.cmd start
```

## Validaciones recomendadas

Smoke completo del pipeline:

```powershell
python ia_fraude/smoke_case_pipeline.py
```

Suite de tests:

```powershell
venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
```

Chequeo de compilacion backend:

```powershell
venv\Scripts\python.exe -m compileall ers_core ia_fraude tests
```

Build del frontend:

```powershell
cd ers-frontend
npm.cmd run build
```

## Flujo minimo para QA/UAT

1. Iniciar sesion con un usuario valido.
2. Configurar integraciones `IDENTITY` y `FINANCIAL`.
3. Evaluar un caso desde `/cases/evaluate`.
4. Verificar detalle, reasoning, scoring y fusion final.
5. Registrar decision manual.
6. Validar auditoria en `/audit/logs`.
7. Generar exportaciones PDF y CSV.

## Usuarios seed

- `admin / Admin#123`
- `supervisor / Super#123`
- `evaluador / Eval#123`

## Notas

- Los logs HTTP salen estructurados en JSON por stdout.
- La auditoria funcional se persiste en `data/audit_logs.jsonl`.
- Las exportaciones se persisten en `data/exports`.
