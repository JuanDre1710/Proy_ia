# Sprint 04 - Frontend

## Dirigido a
Frontend del sistema ERS (React + TypeScript + Vite + MUI).

## Objetivo del sprint
Agregar al dashboard del caso un modulo claro y reutilizable para alertas antifraude y explicabilidad del score IA, orientado a usuarios de negocio.

## Alcance implementado
- Integracion de alertas visuales dentro del dashboard del caso.
- Integracion de explicabilidad del score IA dentro del dashboard del caso.
- Nuevos componentes reutilizables:
  - `AlertsPanel`
  - `AlertItemCard`
  - `RiskScoreBadge`
  - `AIExplanationPanel`
  - `ExplanationVariableList`
- Soporte para multiples alertas simultaneas.
- Cobertura visual para:
  - caso limpio
  - caso con alertas medias
  - caso sospechoso
  - caso critico por fallecido RENAPER
  - caso no evaluable por informacion incompleta

## Modelos agregados
- `FraudAlert`
- `AlertSeverity`
- `AlertType`
- `AIExplanation`
- `ExplanationVariable`

## Estructura impactada
```text
ers-frontend/
  src/
    features/
      cases/
        components/
          AlertsPanel.tsx
          AlertItemCard.tsx
          RiskScoreBadge.tsx
          AIExplanationPanel.tsx
          ExplanationVariableList.tsx
    models/
      cases.ts
    mocks/
      casesMock.ts
```

## Casos mock cubiertos
- `20333444556` -> limpio
- `27123456789` -> alertas medias / requiere revision
- `30111222` -> sospechoso
- `27222333444` -> critico por fallecido RENAPER
- `27999888776` -> informacion incompleta / no evaluable

## Decisiones tecnicas
- Las alertas y la explicacion IA quedaron como bloques independientes del resto del dashboard.
- `RiskScoreBadge` se reutiliza para reforzar consistencia visual entre score y estado del caso.
- `AlertItemCard` usa `Accordion` para mantener legible la vista de negocio sin perder detalle tecnico.
- Los mocks siguen tipados y listos para reemplazo posterior por backend .NET.

## Uso rapido
1. Abrir `/search`
2. Buscar uno de los identificadores mock soportados
3. Ingresar al caso en `/cases/:caseId`
4. Revisar:
   - banner de estado general
   - panel de alertas
   - score y explicabilidad del modelo

## Validacion realizada
- Build exitoso con `npm.cmd run build`.
