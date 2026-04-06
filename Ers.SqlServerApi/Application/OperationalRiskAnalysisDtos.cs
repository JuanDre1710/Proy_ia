namespace Ers.SqlServerApi.Application;

public sealed record AnalyzeCaseRequestDto(
    string ClaimId
);

public sealed record RiskAlertDto(
    string Code,
    string Severity,
    string Title,
    string Detail,
    string Source
);

public sealed record OperationalRiskAnalysisResponseDto(
    string CaseKey,
    string ProcessingState,
    double Score,
    string RiskClass,
    IReadOnlyList<RiskAlertDto> Alerts,
    string SummaryForAnalyst,
    string RecommendedAction,
    bool IsEvaluable,
    string ModelType,
    string LabelingStatus,
    CaseHistoricalFeaturesDto HistoricalFeatures
);
