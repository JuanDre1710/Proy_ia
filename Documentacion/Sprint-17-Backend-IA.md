# Sprint 17 - Backend IA

## Dirigido a
Adaptacion del pipeline para operar con providers demo internos desacoplados de integraciones reales.

## Objetivo del sprint

Reemplazar la dependencia implícita de proveedores externos por fuentes demo internas coherentes con el modelo canónico, manteniendo la arquitectura lista para sustitución futura por integraciones reales.

## Alcance implementado

### Providers demo internos

Se incorporaron:

- `IdentityDemoProvider`
- `FinancialDemoProvider`
- `LaborDemoProvider`

Estos providers:

- no dependen de red
- simulan enrichment a partir del identificador
- soportan `stubMode` para escenarios de QA
- entregan `ProviderPayload` compatible con la anti-corruption layer

### Pipeline desacoplado

Se actualizo la factory de integraciones para resolver providers demo internos por `ProviderType`.

Tipos activos en demo:

- `IDENTITY`
- `FINANCIAL`
- `LABOR_FISCAL`

Se separo la normalizacion de enrichment demo en:

- `IdentityPayloadNormalizer`
- `FinancialDemoPayloadNormalizer`
- `LaborDemoPayloadNormalizer`

### Enrichment laboral/fiscal explicito

`LABOR_FISCAL` dejo de ser una derivacion implícita del proveedor financiero y paso a ser una fuente separada dentro del pipeline.

El pipeline:

- consume identity demo
- consume financial demo
- consume labor demo
- consolida evidencia canonica
- mantiene scoring, reasoning y assessment sin acoplarlos al origen del dato

### Preparacion para futuro reemplazo real

Se mantuvieron estables:

- puertos de providers
- `IntegrationManager`
- `IntegrationAdapterFactory`
- anti-corruption layer
- dominio canonico
- frontend

El reemplazo futuro queda acotado a adapters/factory/normalizers.

## Estructura impactada

```text
Documentacion/
  Sprint-17-Backend-IA.md
docs/
  architecture/
    demo-provider-strategy.md
ers_core/
  adapters/
    anti_corruption/
      financial_demo_normalizer.py
      labor_demo_normalizer.py
    factories/
      integration_adapter_factory.py
    providers/
      demo_provider_base.py
      identity_demo_provider.py
      financial_demo_provider.py
      labor_demo_provider.py
  application/
    ports/
      provider_ports.py
    services/
      case_pipeline_service.py
      rule_engine.py
  domain/
    enums.py
ia_fraude/
  api/
    integration_schemas.py
  smoke_case_pipeline.py
tests/
  support.py
```

## Como corroborarlo rapido

```powershell
venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py
venv\Scripts\python.exe -m unittest tests.test_e2e_pipeline tests.test_integration_audit_and_exports_api tests.test_integration_api_hardening -v
venv\Scripts\python.exe -m compileall ers_core ia_fraude tests
```

## Validacion realizada

- `venv\Scripts\python.exe ia_fraude\smoke_case_pipeline.py`: OK
- `venv\Scripts\python.exe -m unittest tests.test_e2e_pipeline tests.test_integration_audit_and_exports_api tests.test_integration_api_hardening -v`: OK
- `venv\Scripts\python.exe -m compileall ers_core ia_fraude tests`: OK

## Restricciones respetadas

- No se hardcodeo logica pensando en produccion real.
- No se modifico el dominio para la demo.
- No se toco la UI.
- Se mantuvo la anti-corruption layer.

## Limitaciones

- Los datos demo son sinteticos y deterministas.
- Los providers demo no representan contratos reales de terceros.
- `LABOR_FISCAL` hoy enriquece la demo, pero su contrato real podria requerir nuevas variables en adapters y normalizers.

## Deuda pendiente

- agregar adapters reales cuando existan proveedores concretos
- separar configuracion demo/futuro en presets administrativos si el sistema crece
- revisar migracion gradual de adapters legacy que quedaron como referencia historica
