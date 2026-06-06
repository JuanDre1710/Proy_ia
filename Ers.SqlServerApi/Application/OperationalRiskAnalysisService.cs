namespace Ers.SqlServerApi.Application;

public sealed class OperationalRiskAnalysisService
{
    private readonly CaseAssemblyService _caseAssemblyService;

    public OperationalRiskAnalysisService(CaseAssemblyService caseAssemblyService)
    {
        _caseAssemblyService = caseAssemblyService;
    }

    public async Task<OperationalRiskAnalysisResponseDto?> AnalyzeAsync(
        AnalyzeCaseRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var caseModel = await _caseAssemblyService.BuildDomainModelAsync(
            new BuildCaseFromClaimRequestDto(request.ClaimId),
            cancellationToken);

        if (caseModel is null)
        {
            return null;
        }

        return Analyze(caseModel);
    }

    public OperationalRiskAnalysisResponseDto Analyze(CaseModel caseModel)
    {
        var validationAlerts = ValidateCase(caseModel);
        if (validationAlerts.Any(alert => alert.Code == "CASE_NOT_EVALUABLE"))
        {
            return BuildResponse(
                caseModel,
                processingState: "not_evaluable",
                score: 0,
                riskClass: "No evaluable",
                alerts: validationAlerts,
                summaryForAnalyst: "El caso no tiene completitud suficiente para una priorizacion operativa confiable.",
                recommendedAction: "Solicitar mas informacion"
            );
        }

        var ruleAlerts = RunRules(caseModel);
        var alerts = validationAlerts.Concat(ruleAlerts).ToList();
        var score = Score(caseModel, alerts);
        var riskClass = ResolveRiskClass(score, alerts);
        var recommendedAction = ResolveRecommendedAction(riskClass);
        var summary = BuildSummary(caseModel, score, riskClass, alerts, recommendedAction);

        return BuildResponse(
            caseModel,
            processingState: "scored",
            score: score,
            riskClass: riskClass,
            alerts: alerts,
            summaryForAnalyst: summary,
            recommendedAction: recommendedAction
        );
    }

    private static IReadOnlyList<RiskAlertDto> ValidateCase(CaseModel caseModel)
    {
        var alerts = new List<RiskAlertDto>();

        if (string.IsNullOrWhiteSpace(caseModel.Person.PersonId) ||
            string.IsNullOrWhiteSpace(caseModel.SelectedClaim.ClaimId))
        {
            alerts.Add(new RiskAlertDto(
                "CASE_NOT_EVALUABLE",
                "CRITICAL",
                "Caso incompleto",
                "Faltan identificadores minimos para evaluar el caso.",
                "validation"));
            return alerts;
        }

        if (caseModel.SelectedClaim.ClaimDate is null)
        {
            alerts.Add(new RiskAlertDto(
                "MISSING_CLAIM_DATE",
                "WARNING",
                "Fecha de siniestro faltante",
                "El siniestro no tiene fecha registrada. Algunas features temporales quedan degradadas.",
                "validation"));
        }

        if (string.IsNullOrWhiteSpace(caseModel.Policy.PolicyNumber))
        {
            alerts.Add(new RiskAlertDto(
                "MISSING_POLICY_REFERENCE",
                "WARNING",
                "Poliza no identificada",
                "No se encontro numero de poliza para el siniestro seleccionado.",
                "validation"));
        }

        if (caseModel.HistoricalFeatures.TotalClaims == 0)
        {
            alerts.Add(new RiskAlertDto(
                "CASE_NOT_EVALUABLE",
                "CRITICAL",
                "Sin historial operativo",
                "No se pudo reconstruir historial minimo del cliente sobre la base real.",
                "validation"));
        }

        return alerts;
    }

    private static IReadOnlyList<RiskAlertDto> RunRules(CaseModel caseModel)
    {
        var alerts = new List<RiskAlertDto>();
        var features = caseModel.HistoricalFeatures;
        var selectedClaim = caseModel.SelectedClaim;
        var claimedAmount = selectedClaim.ClaimedAmount ?? selectedClaim.ClaimAmount ?? 0m;

        if (features.ClaimsLast365Days >= 3)
        {
            alerts.Add(new RiskAlertDto(
                "HIGH_CLAIM_FREQUENCY",
                "WARNING",
                "Frecuencia de siniestros elevada",
                $"El cliente registra {features.ClaimsLast365Days} siniestros en los ultimos 365 dias.",
                "rules"));
        }

        if (features.DaysSincePreviousClaim.HasValue && features.DaysSincePreviousClaim.Value <= 30)
        {
            alerts.Add(new RiskAlertDto(
                "SHORT_TIME_BETWEEN_CLAIMS",
                "WARNING",
                "Siniestros cercanos en el tiempo",
                $"El siniestro anterior ocurrio {features.DaysSincePreviousClaim.Value} dias antes.",
                "rules"));
        }

        if (features.DaysBetweenPolicyCreationAndClaim.HasValue && features.DaysBetweenPolicyCreationAndClaim.Value <= 60)
        {
            alerts.Add(new RiskAlertDto(
                "EARLY_CLAIM_AFTER_POLICY_START",
                "WARNING",
                "Siniestro cercano al alta de poliza",
                $"El siniestro ocurrio {features.DaysBetweenPolicyCreationAndClaim.Value} dias despues del alta de poliza.",
                "rules"));
        }

        if (features.AverageHistoricalAmount > 0m && claimedAmount >= features.AverageHistoricalAmount * 2m)
        {
            alerts.Add(new RiskAlertDto(
                "CLAIM_AMOUNT_ABOVE_HISTORY",
                "WARNING",
                "Monto por encima del historico",
                $"El monto reclamado del siniestro seleccionado supera 2x el promedio historico del cliente.",
                "rules"));
        }

        if (string.Equals(caseModel.Policy.PolicyStatus, "BAJA", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(caseModel.Policy.LinkStatus, "BAJA", StringComparison.OrdinalIgnoreCase))
        {
            alerts.Add(new RiskAlertDto(
                "INACTIVE_POLICY_REFERENCE",
                "CRITICAL",
                "Poliza o vinculo en estado no vigente",
                "El siniestro seleccionado referencia una poliza o un vinculo con estado no vigente.",
                "rules"));
        }

        return alerts;
    }

    private static double Score(CaseModel caseModel, IReadOnlyList<RiskAlertDto> alerts)
    {
        var score = 15d;
        var features = caseModel.HistoricalFeatures;
        var selectedClaim = caseModel.SelectedClaim;
        var claimedAmount = (double)(selectedClaim.ClaimedAmount ?? selectedClaim.ClaimAmount ?? 0m);

        if (features.ClaimsLast365Days >= 3)
        {
            score += 20;
        }

        if (features.DaysSincePreviousClaim.HasValue && features.DaysSincePreviousClaim.Value <= 30)
        {
            score += 18;
        }

        if (features.DaysBetweenPolicyCreationAndClaim.HasValue && features.DaysBetweenPolicyCreationAndClaim.Value <= 60)
        {
            score += 14;
        }

        if (features.AverageHistoricalAmount > 0m &&
            claimedAmount >= (double)(features.AverageHistoricalAmount * 2m))
        {
            score += 16;
        }

        if (alerts.Any(alert => alert.Code == "INACTIVE_POLICY_REFERENCE"))
        {
            score += 22;
        }

        if (alerts.Any(alert => alert.Code == "MISSING_CLAIM_DATE" || alert.Code == "MISSING_POLICY_REFERENCE"))
        {
            score += 6;
        }

        return Math.Min(Math.Round(score, 2, MidpointRounding.AwayFromZero), 99d);
    }

    private static string ResolveRiskClass(double score, IReadOnlyList<RiskAlertDto> alerts)
    {
        if (alerts.Any(alert => alert.Code == "CASE_NOT_EVALUABLE"))
        {
            return "No evaluable";
        }

        if (alerts.Any(alert => alert.Code == "INACTIVE_POLICY_REFERENCE") || score >= 70)
        {
            return "Sospechoso";
        }

        if (score >= 35)
        {
            return "Requiere revision";
        }

        return "Normal";
    }

    private static string ResolveRecommendedAction(string riskClass)
    {
        return riskClass switch
        {
            "Sospechoso" => "Escalar a revision manual prioritaria",
            "Requiere revision" => "Enviar a revision manual",
            "No evaluable" => "Solicitar mas informacion",
            _ => "Continuar flujo operativo"
        };
    }

    private static string BuildSummary(
        CaseModel caseModel,
        double score,
        string riskClass,
        IReadOnlyList<RiskAlertDto> alerts,
        string recommendedAction)
    {
        var headline = $"Priorizacion operativa {riskClass} con score {score}.";
        var reasons = alerts.Any()
            ? $" Alertas relevantes: {string.Join("; ", alerts.Take(3).Select(alert => alert.Title))}."
            : " Sin alertas relevantes en esta etapa.";

        return
            $"{headline} Caso construido desde datos historicos reales del siniestro {caseModel.SelectedClaim.ClaimNumber}. " +
            $"Accion sugerida: {recommendedAction}.{reasons} " +
            "Este resultado expresa riesgo/priorizacion operativa y no fraude confirmado.";
    }

    private static OperationalRiskAnalysisResponseDto BuildResponse(
        CaseModel caseModel,
        string processingState,
        double score,
        string riskClass,
        IReadOnlyList<RiskAlertDto> alerts,
        string summaryForAnalyst,
        string recommendedAction)
    {
        return new OperationalRiskAnalysisResponseDto(
            caseModel.CaseKey,
            processingState,
            score,
            riskClass,
            alerts,
            summaryForAnalyst,
            recommendedAction,
            processingState != "not_evaluable",
            "rules_plus_operational_scoring_v1",
            "No supervised fraud labels",
            new CaseHistoricalFeaturesDto(
                caseModel.HistoricalFeatures.TotalClaims,
                caseModel.HistoricalFeatures.ClaimsLast365Days,
                caseModel.HistoricalFeatures.AverageHistoricalAmount,
                caseModel.HistoricalFeatures.DaysSincePreviousClaim,
                caseModel.HistoricalFeatures.DaysBetweenPolicyCreationAndClaim
            )
        );
    }
}
