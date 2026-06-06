# Sprint 28 - Backend Operational Risk Pipeline SQL

## Objetivo

Conectar el `CaseModel` construido desde la base real a un pipeline de análisis inicial orientado a priorización operativa, usando reglas + score heurístico, sin labels confiables de fraude confirmado.

## Enfoque

Esta etapa **no** implementa un detector supervisado de fraude confirmado.

Implementa un motor de:

- validación y completitud del caso
- reglas explicables sobre datos históricos reales
- score inicial de riesgo/priorización
- salida operativa para analista

Categorías operativas usadas:

- `Normal`
- `Requiere revision`
- `Sospechoso`
- `No evaluable`

## Endpoint

- `POST /cases/analyze`

Request:

```json
{
  "claimId": "555"
}
```

## Respuesta mínima

```json
{
  "caseKey": "CASE-555",
  "processingState": "scored",
  "score": 67.0,
  "riskClass": "Requiere revision",
  "alerts": [],
  "summaryForAnalyst": "Priorizacion operativa ...",
  "recommendedAction": "Enviar a revision manual",
  "isEvaluable": true,
  "modelType": "rules_plus_operational_scoring_v1",
  "labelingStatus": "No supervised fraud labels",
  "historicalFeatures": {
    "totalClaims": 4,
    "claimsLast365Days": 3,
    "averageHistoricalAmount": 126500.50,
    "daysSincePreviousClaim": 42,
    "daysBetweenPolicyCreationAndClaim": 416
  }
}
```

## Reglas iniciales implementadas

- `HIGH_CLAIM_FREQUENCY`
  - 3 o más siniestros en los últimos 365 días
- `SHORT_TIME_BETWEEN_CLAIMS`
  - 30 días o menos desde el siniestro previo
- `EARLY_CLAIM_AFTER_POLICY_START`
  - 60 días o menos entre alta de póliza y siniestro
- `CLAIM_AMOUNT_ABOVE_HISTORY`
  - monto reclamado actual mayor o igual a 2x el promedio histórico
- `INACTIVE_POLICY_REFERENCE`
  - póliza o vínculo póliza-siniestro con estado no vigente

## Validaciones de completitud

- identificadores básicos obligatorios
- fecha de siniestro
- referencia de póliza
- historial mínimo reconstruible

Si no hay completitud mínima:

- `processingState = not_evaluable`
- `riskClass = No evaluable`
- `recommendedAction = Solicitar mas informacion`

## Score operativo

Se calcula un score heurístico de 0 a 99 sobre datos históricos reales del caso. El score no representa probabilidad de fraude confirmada.

Factores considerados:

- frecuencia reciente de siniestros
- cercanía temporal entre siniestros
- cercanía entre alta de póliza y siniestro
- desviación del monto respecto del histórico
- consistencia operativa de póliza/vínculo
- degradaciones de completitud

## Combinación final

La salida final combina:

- alertas explicables
- score heurístico
- clase operativa
- acción recomendada
- resumen para analista

## Persistencia

En este sprint no se persistió la evaluación final dentro del host SQL.

El punto queda preparado para una próxima etapa donde se puede agregar:

- repositorio de evaluaciones
- tabla de historial de análisis
- correlación entre `claimId`, `caseKey` y ejecución

## Archivos principales

- `Ers.SqlServerApi/Application/OperationalRiskAnalysisService.cs`
- `Ers.SqlServerApi/Application/OperationalRiskAnalysisDtos.cs`
- `Ers.SqlServerApi/Program.cs`

