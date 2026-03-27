# Sprint 04 - Backend IA

## Dirigido a
Ingesta y validación inicial del pipeline de casos del sistema ERS.

## Objetivo del sprint
Implementar la etapa de ingesta y validación del pipeline del caso, antes de cualquier análisis de IA, incluyendo persistencia del caso inicial y conexión del frontend existente al flujo real.

## Alcance implementado

### Backend

Se implementaron endpoints reales:

- `POST /cases/evaluate`
- `GET /cases/{caseId}`

Se agregó un servicio de ingesta y validación que:

- valida identificador
- valida datos mínimos obligatorios
- controla límite diario de evaluaciones por usuario
- verifica disponibilidad básica de integraciones activas
- crea y persiste el caso en estado inicial
- registra validaciones ejecutadas
- deja auditoría preparada del inicio de caso

### Persistencia

Se agregó persistencia simple en archivo para casos:

- `data/cases.json`

También se reutiliza auditoría en:

- `data/audit_logs.jsonl`

### Modelo interno

Se extendió el modelo canónico `Case` con:

- `processing_state`
- `validation_results`

Se definieron estados iniciales:

- `accepted_for_processing`
- `invalid_identifier`
- `insufficient_input`
- `daily_limit_reached`
- `waiting_for_enrichment`

### Frontend

Se conectó el flujo existente de búsqueda al backend real:

- `searchService` usa `POST /cases/evaluate`
- `caseService` usa `GET /cases/{caseId}`

Sin cambiar la UX:

- se mantiene la búsqueda actual
- se mantiene la navegación a `/cases/:caseId`
- se mantiene fallback a mocks si el backend no responde

Cuando el backend devuelve un caso inicial sin enrichment, el dashboard muestra una versión placeholder compatible con la UI actual.

## Estructura impactada

```text
Documentacion/
  Sprint-04-Backend-IA.md
data/
  cases.json
ers_core/
  domain/
    enums.py
    models.py
  application/
    ports/
      case_repository.py
    services/
      case_ingestion_service.py
  adapters/
    repositories/
      file_case_repository.py
ia_fraude/
  app.py
  api/
    case_routes.py
    case_schemas.py
ers-frontend/
  src/
    models/
      search.ts
    services/
      searchService.ts
      caseService.ts
    features/
      search/
        hooks/
          useSearchFlow.ts
```

## Decisiones técnicas

- No se ejecuta score ni razonamiento en este sprint.
- La creación del caso usa siempre el modelo interno canónico `Case`.
- No se consumen payloads externos crudos.
- La disponibilidad de integraciones se valida de manera básica a partir de configuraciones activas.
- Si no hay integraciones activas, el caso queda en `waiting_for_enrichment`.
- El frontend mantiene compatibilidad con mocks durante la migración.
- El `caseId` se mantiene igual al identificador consultado para no romper la navegación actual.

## Qué deberías poder notar ahora

### En la búsqueda

Si el backend está levantado:

- al buscar un identificador válido, se crea un caso real
- la búsqueda navega al dashboard del caso creado
- si faltan integraciones activas, el caso entra como `waiting_for_enrichment`
- si el usuario alcanza el límite diario, la búsqueda devuelve bloqueo

### En el dashboard

Para casos creados por esta etapa:

- se abre el dashboard con información placeholder de ingesta
- todavía no hay score real
- todavía no hay razonamiento real
- debería verse un resumen indicando que el caso está en una etapa previa a IA

### En archivos

Deberías notar:

- `data/cases.json` con casos persistidos
- `data/audit_logs.jsonl` con trazas del inicio de evaluación

## Cómo probarlo manualmente

### Flujo básico

1. Levantar backend
2. Levantar frontend
3. Iniciar sesión
4. Ir a búsqueda
5. Buscar un identificador válido

Resultado esperado:

- se crea un caso en `data/cases.json`
- se navega a `/cases/{caseId}`
- el dashboard abre con estado de ingesta

### Flujo de validación de identificador

1. Ingresar un identificador inválido

Resultado esperado:

- no debe abrir dashboard
- debe mostrarse error de validación

### Flujo de espera por enrichment

1. Dejar sin integraciones activas el sistema
2. Crear un caso válido

Resultado esperado:

- el caso se crea
- el estado queda en `waiting_for_enrichment`

### Flujo de límite diario

1. Repetir evaluaciones suficientes para el mismo usuario

Resultado esperado:

- al superar el límite, el estado pasa a `daily_limit_reached`

## Validación realizada

- `compileall` sobre `ers_core` e `ia_fraude`: OK
- `npm.cmd run build` en frontend: OK
- smoke test del servicio de ingesta:
  - `waiting_for_enrichment`: OK
  - `accepted_for_processing`: OK
  - `invalid_identifier`: OK
  - `daily_limit_reached`: OK
  - lectura posterior con `get_case`: OK

## Restricciones respetadas

- No se ejecutó score.
- No se ejecutó razonamiento.
- No se dependió de payloads externos crudos.
- Se usó siempre el modelo interno del caso.
- No se cambió la UX de búsqueda ni navegación.

## Deuda pendiente / siguiente paso

- agregar enrichment real con adapters configurables
- conectar validaciones a integraciones específicas requeridas por tipo de caso
- reemplazar persistencia en archivo por almacenamiento real
- exponer uso diario real al frontend
- incorporar estados posteriores del pipeline sin romper el caso canónico
