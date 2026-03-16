# Sprint 05 - Frontend

## Dirigido a
Frontend del sistema ERS (React + TypeScript + Vite + MUI).

## Objetivo del sprint
Agregar un mapa de calor de riesgo al dashboard del caso para visualizar el impacto de las variables relevantes sobre el score de fraude.

## Alcance implementado
- Nuevo bloque reusable de heatmap visual dentro del feature `cases`.
- Componente principal `RiskHeatmapCard`.
- Filas visuales por variable con severidad, valor, intensidad y descripcion.
- Leyenda visual desacoplada.
- Soporte para expandir / colapsar el bloque.
- Integracion directa en `CaseDashboardPage`.

## Componentes implementados
- `RiskHeatmapCard`
- `RiskVariableRow`
- `RiskLegend`

## Modelos y helpers agregados
- `RiskVariableImpact`
- `getImpactColor`
- `getImpactLabel`
- `getImpactWeight`

## Estructura impactada
```text
ers-frontend/
  src/
    features/
      cases/
        components/
          RiskHeatmapCard.tsx
          RiskVariableRow.tsx
          RiskLegend.tsx
        helpers/
          riskHeatmap.ts
    models/
      cases.ts
    mocks/
      casesMock.ts
```

## Casos mock cubiertos
- `20333444556` -> variables de bajo impacto
- `27123456789` -> impacto medio
- `30111222` -> impacto alto / critico
- `27222333444` -> impacto critico por fallecido RENAPER
- `27999888776` -> impacto alto / critico por informacion insuficiente

## Decisiones tecnicas
- Se eligio una implementacion sin librerias de charts para priorizar mantenibilidad y claridad.
- La intensidad se representa con barras, colores y etiquetas semanticas.
- El componente es reutilizable y desacoplado del servicio de datos.
- Se incorporo accesibilidad basica con labels claros en las barras.

## Uso rapido
1. Abrir `/search`
2. Consultar un caso mock
3. Entrar a `/cases/:caseId`
4. Revisar el bloque "Mapa de calor de riesgo"

## Validacion realizada
- `npm.cmd install`
- `npm.cmd run build`
