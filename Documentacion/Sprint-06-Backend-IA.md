# Sprint 06 - Backend IA

## Dirigido a
Integracion del segundo proveedor y consolidacion de evidencia normalizada del caso antes de reglas y razonamiento.

## Objetivo del sprint
Integrar el segundo proveedor relevante del pipeline, consolidar evidencia estructurada del caso en el modelo interno y dejar el expediente listo para reglas duras sin exponer payloads externos a la UI ni ejecutar todavia scoring.

## Alcance implementado

### Proveedores y adapters

Se implementaron adapters concretos para enrichment del caso:

- `IdentityProviderAdapter`
- `NosisProviderAdapter`

La resolucion del adapter sigue dependiendo de configuracion dinamica via `IntegrationManager`.

### Normalizacion

Se agregaron normalizadores para transformar payloads externos a estructuras canonicas:

- `IdentityPayloadNormalizer`
- `NosisPayloadNormalizer`

Se mapean a:

- `IdentityStatus`
- `FinancialInfo`
- `LaborFiscalInfo`
- `Evidence`
- `Alert`

### Consolidacion del caso

Se reemplazo el paso previo que mezclaba enrichment con scoring por una consolidacion explicita de evidencia:

- el caso consulta proveedor de identidad
- el caso consulta segundo proveedor financiero/laboral
- ambos payloads se normalizan
- la evidencia queda unificada en el caso
- se persiste un bundle estructurado:
  - `ConsolidatedEvidence`

Se agrego el nuevo estado:

- `ready_for_rules`

Este estado indica que la evidencia estructurada minima ya existe para pasar a reglas duras.

### Manejo de escenarios

Se dejo manejo explicito para:

- respuesta parcial
- datos insuficientes
- error tecnico
- timeout
- proveedor deshabilitado

Cuando la evidencia no alcanza para reglas:

- el caso vuelve o permanece en `waiting_for_enrichment`
- igual se persiste la evidencia parcial lograda
- nunca se expone XML/JSON crudo a frontend

### Frontend

Se conecto el frontend existente para consumir el caso normalizado:

- datos personales consolidados
- datos financieros
- datos laborales/fiscales
- alertas normalizadas
- estado `ready_for_rules`

Sin tocar el diseño visual.

El dashboard sigue mostrando score placeholder porque este sprint no aplica scoring.

## Estructura impactada

```text
Documentacion/
  Sprint-06-Backend-IA.md
ers_core/
  domain/
    enums.py
    models.py
  adapters/
    anti_corruption/
      identity_normalizer.py
      nosis_normalizer.py
    factories/
      integration_adapter_factory.py
    providers/
      errors.py
      identity_provider_adapter.py
      nosis_provider_adapter.py
    repositories/
      file_case_repository.py
  application/
    services/
      case_ingestion_service.py
      case_pipeline_service.py
ia_fraude/
  api/
    case_routes.py
    case_schemas.py
  smoke_case_pipeline.py
ers-frontend/
  src/
    features/
      cases/
        CaseDashboardPage.tsx
    services/
      caseService.ts
      searchService.ts
```

## Decisiones tecnicas

- Se uso `NosisProviderAdapter` como segundo proveedor financiero/laboral del pipeline.
- El frontend consume solo DTOs normalizados del backend.
- La estructura `ConsolidatedEvidence` vive en dominio para dejar trazabilidad de readiness, warnings y estados por proveedor.
- La evidencia parcial se persiste aunque el caso no quede listo para reglas.
- No se ejecuto scoring, razonamiento ni decision final en este sprint.
- La factory de integraciones sigue leyendo configuracion dinamica y resuelve adapter segun `provider_type` y `provider_code`.

## Que deberias poder notar ahora

### En backend

Si hay proveedor de identidad y proveedor financiero activos:

- el caso deja de ser solo “ingesta”
- se llenan `financial_info` y `labor_fiscal_info`
- aparecen `evidences` normalizadas
- aparece `consolidated_evidence`
- el estado puede pasar a `ready_for_rules`

### En frontend

Para un caso `ready_for_rules` deberias ver:

- datos personales completos
- datos financieros consolidados
- datos laborales/fiscales consolidados
- alertas operativas del enrichment
- score todavia en placeholder

### En persistencia

En `data/cases.json` deberias notar:

- `financial_info`
- `labor_fiscal_info`
- `evidences`
- `alerts`
- `consolidated_evidence`
- `pipelineStage = evidence_consolidation`

## Como probarlo manualmente

### Flujo exitoso

1. Tener una integracion activa `IDENTITY`
2. Tener una integracion activa `FINANCIAL` con codigo `NOSIS`
3. Levantar backend
4. Levantar frontend
5. Buscar un identificador valido
6. Abrir el dashboard

Resultado esperado:

- `POST /cases/evaluate` devuelve `ready_for_rules`
- `GET /cases/{caseId}` devuelve datos financieros/laborales normalizados
- el dashboard muestra informacion consolidada sin score real

### Flujo parcial

1. Configurar el proveedor financiero con `settings.stubMode = partial`
2. Evaluar un identificador valido

Resultado esperado:

- el caso puede seguir en `ready_for_rules`
- `evidenceSummary.providerStatuses.FINANCIAL = partial`
- quedan warnings persistidos

### Flujo timeout

1. Configurar el proveedor financiero con `settings.stubMode = timeout`
2. Evaluar un identificador valido

Resultado esperado:

- el caso queda en `waiting_for_enrichment`
- se persiste la evidencia disponible
- aparece alerta/warning por timeout

## Como corroborarlo rapido

1. Ejecutar `python ia_fraude/smoke_case_pipeline.py`
2. Revisar `data/case_pipeline_smoke/cases.json`
3. Revisar `data/case_pipeline_smoke/audit_logs.jsonl`

Resultado esperado:

- caso listo para reglas: OK
- caso con respuesta parcial: OK
- caso con timeout: OK
- persistencia completa del bundle de evidencia: OK

## Validacion realizada

- `python -m compileall ers_core ia_fraude`: OK
- `python ia_fraude/smoke_case_pipeline.py`: OK
- `npm.cmd run build` en `ers-frontend`: OK

Smoke test verificado:

- `create_case_evaluation`: OK
- `consolidate_case_evidence success`: OK
- `consolidate_case_evidence partial provider`: OK
- `consolidate_case_evidence timeout provider`: OK
- `ready_for_rules`: OK
- persistencia de evidencia consolidada con `get_case`: OK

## Restricciones respetadas

- Nunca se expuso XML/JSON crudo externo a la UI.
- No se aplico scoring.
- No se aplico razonamiento.
- El caso queda listo para reglas duras, no para decision final.

## Deuda pendiente / siguiente paso

- aplicar reglas duras sobre `ConsolidatedEvidence`
- definir criterios exactos de bloqueo y observacion
- agregar mas de un proveedor por tipo con estrategia de merge
- registrar auditoria mas detallada por provider call
- reemplazar adapters stub por integraciones reales
