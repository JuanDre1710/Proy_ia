# Sprint 03 - Frontend

## Dirigido a
Frontend del sistema ERS (React + TypeScript + Vite + MUI).

## Objetivo del sprint
Construir el dashboard antifraude principal del caso evaluado, mostrando la informacion consolidada del cliente, el score de riesgo y el estado general del expediente.

## Alcance implementado
- Nuevo feature `cases` para el dashboard del caso.
- Nueva ruta principal de detalle:
  - `/cases/:caseId`
- Carga de datos desde mock service desacoplado.
- Estados soportados:
  - `loading`
  - `error`
  - `empty`
  - `success`
- Componentes visuales desacoplados de la carga de datos.
- Integracion del flujo de busqueda con apertura de casos evaluables, fallecidos y no evaluables.

## Estructura agregada
```text
ers-frontend/
  src/
    features/
      cases/
        components/
          CaseHeaderSummary.tsx
          CaseStatusBanner.tsx
          ClaimsHistoryCard.tsx
          FinancialInfoCard.tsx
          LaborFiscalCard.tsx
          PersonalInfoCard.tsx
          RiskScoreCard.tsx
        CaseDashboardPage.tsx
    models/
      cases.ts
    mocks/
      casesMock.ts
    services/
      caseService.ts
```

## Modelos implementados
- `CaseEvaluation`
- `PersonalInfo`
- `FinancialInfo`
- `LaborFiscalInfo`
- `ClaimRecord`
- `RiskScore`
- `RiskCategory`

## Componentes implementados
- `CaseDashboardPage`
- `CaseHeaderSummary`
- `RiskScoreCard`
- `PersonalInfoCard`
- `FinancialInfoCard`
- `LaborFiscalCard`
- `ClaimsHistoryCard`
- `CaseStatusBanner`

## Casos mock disponibles
- `20333444556` -> caso normal
- `27123456789` -> requiere revision
- `30111222` -> sospechoso de fraude
- `27222333444` -> fallecido
- `27999888776` -> no evaluable

## Uso rapido
1. Ingresar a `/search`
2. Probar alguno de los identificadores mock sugeridos en la pantalla
3. El sistema redirige a `/cases/:caseId` cuando el caso tiene dashboard disponible

## Decisiones tecnicas
- Se separo el dashboard del caso en un feature propio para evitar mezclar visualizacion de expediente con flujo de busqueda.
- Se mantuvo el desacople entre datos y UI mediante `caseService`.
- Se reutilizaron componentes base compartidos (`PageHeader`, `SectionCard`, `StatusState`, `DataTable`) para conservar consistencia visual.
- Se dejaron mocks tipados y faciles de reemplazar por backend .NET.

## Integracion futura
- `caseService.ts` contiene el punto natural para reemplazar el mock por `GET /api/cases/:caseId`.

## Validacion realizada
- Build exitoso con `npm.cmd run build`.
