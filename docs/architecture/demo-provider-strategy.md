# Demo Provider Strategy

## Objetivo

Permitir que el pipeline del backend funcione hoy sin RENAPER, Nosis ni otros servicios reales, usando providers demo internos que respetan el modelo canónico y se puedan reemplazar luego sin tocar dominio ni frontend.

## Providers demo internos

Implementados:

- `IdentityDemoProvider`
- `FinancialDemoProvider`
- `LaborDemoProvider`

Ubicacion:

- `ers_core/adapters/providers/identity_demo_provider.py`
- `ers_core/adapters/providers/financial_demo_provider.py`
- `ers_core/adapters/providers/labor_demo_provider.py`

## Contrato arquitectonico

Los providers demo:

- viven en adapters
- responden a puertos de aplicacion
- devuelven `ProviderPayload`
- no escriben en dominio
- no exponen payloads crudos al frontend

La conversion a modelo interno sigue pasando por la anti-corruption layer:

- identidad:
  - `IdentityPayloadNormalizer`
- financiero:
  - `FinancialDemoPayloadNormalizer`
- laboral/fiscal:
  - `LaborDemoPayloadNormalizer`

## Pipeline actual

1. `CaseIngestionService` valida identificador y verifica providers requeridos.
2. `CasePipelineService` resuelve integrations activas por `ProviderType`.
3. La factory entrega un provider demo interno.
4. El provider devuelve payload raw demo.
5. El normalizer transforma a:
   - `IdentityStatus`
   - `FinancialInfo`
   - `LaborFiscalInfo`
   - `Evidence`
   - `Alert`
6. El resto del pipeline sigue igual:
   - hard rules
   - reasoning
   - scoring
   - relaciones
   - assessment final

## Dependencias reales removidas del flujo demo

La demo ya no depende de:

- endpoints HTTP reales
- credenciales de terceros
- disponibilidad de RENAPER o Nosis
- formatos nativos externos dentro del dominio

Las pruebas de conectividad de estos providers son locales y de configuracion, no de red.

## Parte demo vs parte preparada para reemplazo futuro

Parte demo:

- providers internos deterministas
- `stubMode` para simular `success`, `partial`, `timeout`, `technical_error`, `insufficient`
- datos sinteticos generados desde el identificador

Parte preparada para reemplazo real:

- `ProviderRequest`
- `ProviderPayload`
- `IntegrationManager`
- `IntegrationAdapterFactory`
- anti-corruption layer
- dominio canonico
- pipeline de aplicacion

## Regla de reemplazo futuro

Cuando exista una integracion real:

1. se agrega un adapter real en `ers_core/adapters/providers`
2. se mantiene el mismo `ProviderType`
3. se conserva el `ProviderPayload`
4. se reutiliza o ajusta el normalizer correspondiente
5. no se modifica el dominio
6. no se modifica el frontend

## Provider types usados en demo

- `IDENTITY`
- `FINANCIAL`
- `LABOR_FISCAL`

`LABOR_FISCAL` enriquece la demo y queda desacoplado del proveedor financiero, pero no bloquea por si solo el readiness minimo del caso.

## Validacion

- smoke:
  - `venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py`
- integration/e2e:
  - `venv\Scripts\python.exe -m unittest tests.test_e2e_pipeline tests.test_integration_audit_and_exports_api tests.test_integration_api_hardening -v`
