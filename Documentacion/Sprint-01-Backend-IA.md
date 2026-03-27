# Sprint 01 - Backend IA

## Dirigido a
Arquitectura base del backend y del motor IA del sistema ERS.

## Objetivo del sprint
Definir el modelo interno canónico del sistema y la base de adaptación para desacoplar frontend, backend e integraciones externas.

## Alcance implementado

### Modelo canónico

Se definió el modelo interno canónico para:

- `Case`
- `Person`
- `IdentityStatus`
- `FinancialInfo`
- `LaborFiscalInfo`
- `Evidence`
- `Alert`
- `ReasoningResult`
- `ScoreResult`
- `FinalAssessment`
- `Decision`
- `AuditLog`
- `IntegrationConfig`

### Separación arquitectónica

Se creó una base de carpetas con separación explícita entre:

- `domain`
- `application`
- `adapters`

### Puertos de proveedores

Se definieron interfaces para adapters de proveedores:

- `IdentityProvider`
- `FinancialProvider`
- `FutureRelationshipProvider`
- `FutureDocumentProvider`

### Anti-corruption layer

Se dejó preparada la estrategia de mapeo:

- `external -> domain`
- `domain -> api dto`
- `api dto -> ui model`

### Documentación de arquitectura

Se generó documentación específica para:

- modelo de dominio
- estrategia de integración
- orden obligatorio del pipeline

## Estructura impactada

```text
Documentacion/
  Sprint-01-Backend-IA.md
docs/
  architecture/
    domain-model.md
    integration-strategy.md
    pipeline-order.md
ers_core/
  domain/
    enums.py
    models.py
  application/
    dto/
      api_models.py
    mappers/
      domain_to_api.py
      api_to_ui.py
    ports/
      provider_ports.py
  adapters/
    anti_corruption/
      external_to_domain.py
```

## Decisiones técnicas

- Se creó un paquete nuevo `ers_core` para no mezclar arquitectura nueva con el código legacy existente.
- El dominio canónico se definió como centro estable del sistema.
- El frontend no depende del dominio canónico ni de payloads crudos externos.
- Los adapters son el único lugar autorizado para consumir payloads de terceros.
- El razonador y el score quedaron diseñados para operar solo sobre evidencia normalizada.
- El pipeline obligatorio quedó fijado y documentado para evitar inversiones en sprints posteriores.

## Qué deberías poder notar ahora

### A nivel código

Deberías notar:

- una carpeta nueva `ers_core/`
- contratos de dominio y puertos nuevos
- mappers explícitos entre capas
- documentación nueva en `docs/architecture/`

### A nivel funcional

No deberías notar cambios en la UI todavía.

Este sprint fue fundacional. Su resultado visible está en la estructura, contratos y documentación, no en comportamiento de pantallas.

## Cómo corroborarlo

1. Revisar `ers_core/domain/models.py`
2. Revisar `ers_core/application/ports/provider_ports.py`
3. Revisar `ers_core/adapters/anti_corruption/external_to_domain.py`
4. Revisar `docs/architecture/`

Resultado esperado:

- existe una arquitectura base coherente
- existe separación clara entre dominio, DTOs y adapters
- está documentado el orden del pipeline

## Validación realizada

- `compileall` sobre `ers_core`: OK

## Restricciones respetadas

- No se tocó la UI.
- No se asumieron contratos API finales.
- No se implementaron integraciones reales.
- No se implementó lógica productiva del caso.
- No se acopló el dominio a formatos de terceros.

## Deuda pendiente / siguiente paso

- Implementar administración dinámica de integraciones.
- Agregar persistencia real para configuraciones y auditoría.
- Exponer endpoints de administración.
- Conectar el frontend Admin con backend real manteniendo fallback temporal a mocks.
