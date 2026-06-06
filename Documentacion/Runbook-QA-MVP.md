# Runbook QA MVP

## Backend

```powershell
venv\Scripts\python.exe -m uvicorn ia_fraude.app:app --host 0.0.0.0 --port 8000
```

## Frontend

```powershell
cd ers-frontend
npm.cmd start
```

## Checks previos a QA

```powershell
venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
python ia_fraude/smoke_case_pipeline.py
venv\Scripts\python.exe -m compileall ers_core ia_fraude tests
cd ers-frontend
npm.cmd run build
```

## Casos a validar

### Ruta feliz

- login
- evaluacion de caso valido
- reasoning
- scoring
- fusion final
- decision manual
- exportacion
- auditoria

### Casos bloqueados

- caso excluido por politica
- caso no evaluable por timeout
- acceso no autorizado a `/audit/logs`
- rate limit superado

## Artefactos a revisar

- `data/cases.json`
- `data/audit_logs.jsonl`
- `data/exports/exports.json`
- `data/exports/files`
