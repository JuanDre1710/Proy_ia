namespace Ers.SqlServerApi.Application;

public sealed class CaseDashboardService
{
    private readonly CaseAssemblyService _caseAssemblyService;
    private readonly OperationalRiskAnalysisService _riskAnalysisService;

    public CaseDashboardService(
        CaseAssemblyService caseAssemblyService,
        OperationalRiskAnalysisService riskAnalysisService)
    {
        _caseAssemblyService = caseAssemblyService;
        _riskAnalysisService = riskAnalysisService;
    }

    public async Task<SqlCaseDashboardResponseDto?> GetCaseAsync(
        string caseId,
        CancellationToken cancellationToken = default)
    {
        var claimId = ExtractClaimId(caseId);
        if (string.IsNullOrWhiteSpace(claimId))
        {
            return null;
        }

        var caseModel = await _caseAssemblyService.BuildDomainModelAsync(
            new BuildCaseFromClaimRequestDto(claimId),
            cancellationToken);

        if (caseModel is null)
        {
            return null;
        }

        var analysis = await _riskAnalysisService.AnalyzeAsync(
            new AnalyzeCaseRequestDto(claimId),
            cancellationToken);

        if (analysis is null)
        {
            return null;
        }

        return MapToDashboard(caseModel, analysis);
    }

    public Task<SqlCaseGraphResponseDto> GetGraphAsync(
        string caseId,
        CancellationToken cancellationToken = default)
    {
        var nodes = new List<SqlCaseGraphNodeDto>();
        var edges = new List<SqlCaseGraphEdgeDto>();

        return Task.FromResult(new SqlCaseGraphResponseDto(caseId, nodes, edges));
    }

    private static string ExtractClaimId(string caseId)
    {
        var normalized = caseId.Trim();
        return normalized.StartsWith("CASE-", StringComparison.OrdinalIgnoreCase)
            ? normalized["CASE-".Length..]
            : normalized;
    }

    private static SqlCaseDashboardResponseDto MapToDashboard(
        CaseModel caseModel,
        OperationalRiskAnalysisResponseDto analysis)
    {
        var identifier = caseModel.Person.DocumentNumber ?? caseModel.Person.TaxId ?? caseModel.Person.PersonId;
        var identifierType = !string.IsNullOrWhiteSpace(caseModel.Person.DocumentNumber) ? "DNI" : "CUIT";
        var requestedAt = (caseModel.SelectedClaim.ClaimDate ?? DateTime.UtcNow).ToString("O");
        var riskCategory = MapScoreCategory(analysis.RiskClass);
        var suggestedPriority = MapSuggestedPriority(analysis.RiskClass);
        var finalPriority = MapFinalPriority(analysis.RiskClass);
        var topFactors = analysis.Alerts
            .Take(4)
            .Select(alert => new SqlCaseScoreFactorDto(
                alert.Code.ToLowerInvariant(),
                alert.Title,
                alert.Detail,
                MapWeight(alert.Severity)))
            .ToList();

        if (topFactors.Count == 0)
        {
            topFactors.Add(new SqlCaseScoreFactorDto(
                "operational_baseline",
                "Sin factores destacados",
                "No se detectaron alertas relevantes en esta etapa.",
                0));
        }

        var featureContributions = BuildFeatureContributions(caseModel, analysis);
        var alertDtos = analysis.Alerts
            .Select(alert => new SqlCaseAlertDto(
                alert.Code,
                alert.Severity,
                alert.Title,
                alert.Detail,
                alert.Detail,
                alert.Source == "validation" ? "IDENTITY" : "INTERNAL_RULE",
                alert.Code.ToLowerInvariant(),
                BuildAlertRecommendation(alert)))
            .ToList();

        var historyDtos = caseModel.ClaimHistory
            .Select(item => new SqlCaseHistoryDto(
                item.ClaimId,
                (item.ClaimDate ?? DateTime.UtcNow).ToString("yyyy-MM-dd"),
                item.ClaimType ?? "Siniestro",
                item.ClaimedAmount ?? item.ClaimAmount ?? 0m,
                MapHistoryStatus(item.StatusCode),
                item.PolicyNumber ?? "Poliza no informada",
                BuildHistoryNotes(item)))
            .ToList();

        var validationResults = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["processingState"] = analysis.ProcessingState,
            ["isEvaluable"] = analysis.IsEvaluable ? "true" : "false",
            ["labelingStatus"] = analysis.LabelingStatus
        };

        var metadata = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase)
        {
            ["analystSummary"] = analysis.SummaryForAnalyst,
            ["caseOrigin"] = "sql_server_operational",
            ["policyNumber"] = caseModel.Policy.PolicyNumber ?? string.Empty,
            ["certificateNumber"] = caseModel.Policy.CertificateNumber ?? string.Empty,
            ["claimNumber"] = caseModel.SelectedClaim.ClaimNumber
        };

        return new SqlCaseDashboardResponseDto(
            caseModel.CaseKey,
            identifier,
            identifierType,
            requestedAt,
            analysis.ProcessingState,
            validationResults,
            metadata,
            new SqlCaseSubjectDto(
                caseModel.Person.DisplayName,
                null,
                null,
                caseModel.Person.Email,
                null,
                null,
                null,
                null,
                true,
                false
            ),
            new SqlCaseFinancialInfoDto(
                null,
                null,
                "Media",
                null,
                null,
                caseModel.Policy.PolicyPremium.HasValue
                    ? $"Premio poliza {caseModel.Policy.PolicyPremium.Value:0.##}"
                    : "Sin estimacion",
                $"Promedio historico de siniestros: {caseModel.HistoricalFeatures.AverageHistoricalAmount:0.##}"
            ),
            new SqlCaseLaborFiscalInfoDto(
                "Sin enrichment externo",
                "Sin enrichment externo",
                "Sin enrichment externo",
                "Sin enrichment externo",
                null,
                "Sprint SQL operativo: aun sin integraciones RENAPER, Nosis ni AFIP."
            ),
            historyDtos,
            alertDtos,
            new SqlCaseScoreDto(
                analysis.Score,
                riskCategory,
                EstimateConfidence(analysis.RiskClass),
                analysis.ModelType,
                topFactors,
                featureContributions),
            new SqlCaseReasoningDto(
                analysis.SummaryForAnalyst,
                analysis.SummaryForAnalyst,
                $"Clasificacion operativa {analysis.RiskClass}.",
                alertDtos.Select(item => item.Title).ToList(),
                analysis.RiskClass == "Normal"
                    ? new[] { "No se detectaron alertas operativas criticas en la etapa inicial." }
                    : Array.Empty<string>(),
                alertDtos.Select(item => item.Detail).ToList(),
                analysis.Alerts.Where(item => item.Source == "validation").Select(item => item.Detail).ToList(),
                suggestedPriority,
                new[] { analysis.RecommendedAction },
                EstimateConfidence(analysis.RiskClass),
                Array.Empty<string>()
            ),
            new SqlCaseFinalAssessmentDto(
                analysis.RiskClass,
                finalPriority,
                analysis.RecommendedAction,
                EstimateConfidence(analysis.RiskClass),
                analysis.SummaryForAnalyst,
                analysis.IsEvaluable ? "MEDIA" : "BAJA",
                false,
                analysis.Alerts.Any(item => item.Code == "CASE_NOT_EVALUABLE"),
                analysis.Alerts
                    .Where(item => item.Severity == "CRITICAL")
                    .Select(item => item.Title)
                    .ToList()
            )
        );
    }

    private static Dictionary<string, double> BuildFeatureContributions(
        CaseModel caseModel,
        OperationalRiskAnalysisResponseDto analysis)
    {
        var selectedAmount = (double)(caseModel.SelectedClaim.ClaimedAmount ?? caseModel.SelectedClaim.ClaimAmount ?? 0m);
        return new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase)
        {
            ["total_claims"] = caseModel.HistoricalFeatures.TotalClaims,
            ["claims_last_365_days"] = caseModel.HistoricalFeatures.ClaimsLast365Days,
            ["average_historical_amount"] = (double)caseModel.HistoricalFeatures.AverageHistoricalAmount,
            ["days_since_previous_claim"] = caseModel.HistoricalFeatures.DaysSincePreviousClaim ?? 0,
            ["days_between_policy_creation_and_claim"] = caseModel.HistoricalFeatures.DaysBetweenPolicyCreationAndClaim ?? 0,
            ["selected_claim_amount"] = selectedAmount,
            ["operational_score"] = analysis.Score
        };
    }

    private static string MapScoreCategory(string riskClass)
    {
        return riskClass switch
        {
            "Sospechoso" => "FRAUD_SUSPECT",
            "Normal" => "NORMAL",
            _ => "REVIEW"
        };
    }

    private static string MapSuggestedPriority(string riskClass)
    {
        return riskClass switch
        {
            "Sospechoso" => "HIGH",
            "Requiere revision" => "MEDIUM",
            _ => "LOW"
        };
    }

    private static string MapFinalPriority(string riskClass)
    {
        return riskClass switch
        {
            "Sospechoso" => "HIGH",
            "Requiere revision" => "MEDIUM",
            "No evaluable" => "MEDIUM",
            _ => "LOW"
        };
    }

    private static double MapWeight(string severity)
    {
        return severity switch
        {
            "CRITICAL" => 0.9d,
            "WARNING" => 0.6d,
            "INFO" => 0.25d,
            _ => 0.1d
        };
    }

    private static double EstimateConfidence(string riskClass)
    {
        return riskClass switch
        {
            "Sospechoso" => 0.81d,
            "Requiere revision" => 0.68d,
            "Normal" => 0.74d,
            _ => 0.52d
        };
    }

    private static string BuildAlertRecommendation(RiskAlertDto alert)
    {
        return alert.Source == "validation"
            ? "Corregir o completar datos antes de continuar."
            : "Mantener trazabilidad y revisar manualmente la alerta.";
    }

    private static string MapHistoryStatus(string statusCode)
    {
        return statusCode.ToUpperInvariant() switch
        {
            "RECHAZADO" => "Rechazado",
            "OBSERVADO" => "Observado",
            _ => "Aprobado"
        };
    }

    private static string BuildHistoryNotes(HistoricalClaim claim)
    {
        var amount = claim.ClaimedAmount ?? claim.ClaimAmount;
        return amount.HasValue
            ? $"Monto historico registrado: {amount.Value:0.##}."
            : "Sin monto historico registrado.";
    }
}
