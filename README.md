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
- `ERS_IDENTITY_DATA_PROVIDER`
- `ERS_ACTIVE_CLAIM_STATUS_CODES`
- `ERS_ENTERPRISE_SQLSERVER_CONNECTION_STRING`

En produccion no debe usarse el secreto JWT por defecto.

Busqueda por identidad:

- `ERS_IDENTITY_DATA_PROVIDER=demo` activa el provider interno local.
- `ERS_IDENTITY_DATA_PROVIDER=sqlserver` deja preparado el contrato empresarial.
- `ERS_ACTIVE_CLAIM_STATUS_CODES` define que estados se consideran activos.

Nota de arquitectura:

- Este repo backend corre sobre FastAPI/Python.
- El modo empresa pedido para SQL Server con `UseSqlServer(cfg.GetConnectionString("DefaultConnection"))`
  debe implementarse en un componente .NET externo que respete los contratos desacoplados del backend.
- En este sprint el backend Python queda listo para consumir ese provider sin acoplar dominio ni frontend
  a EF Core.

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

## Levantar API SQL operativa

```powershell
cd Ers.SqlServerApi
dotnet run
```

Swagger:

- `http://localhost:5251/swagger`

## Bandeja operativa SQL

Flujo actual esperado para la bandeja del frontend:

- `GET /cases` devuelve la cola operativa de siniestros pendientes de analisis o con seguimiento abierto.
- si el siniestro todavia no existe en `AF_MONITORED_CASES`, igual aparece en la bandeja como `pendiente`.
- las acciones `Aceptar`, `Denegar` y `Revisar` registran decision operativa por `SIN_ID`.
- al decidir un siniestro que todavia no tenia fila en `AF_MONITORED_CASES`, la API crea el registro minimo operativo y guarda auditoria.
- los casos `aceptado` o `denegado` quedan `cerrado` y salen de la cola operativa.
- los casos enviados a revision quedan `en_revision` y permanecen visibles en la bandeja.

Endpoints principales:

- `GET /cases`
- `POST /cases/{sinId}/decision`
- `POST /cases/{sinId}/resolution`
- `GET /monitoring/cases`
- `GET /monitoring/cases/{sinId}`

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
8. Para el flujo nuevo, consultar `/identity/search` y luego `/identity/cases/from-claim` cuando haya un
   siniestro unico o uno seleccionado manualmente.

## Usuarios seed

- `admin / Admin#123`
- `supervisor / Super#123`
- `evaluador / Eval#123`

## Notas

- Los logs HTTP salen estructurados en JSON por stdout.
- La auditoria funcional se persiste en `data/audit_logs.jsonl`.
- Las exportaciones se persisten en `data/exports`.
