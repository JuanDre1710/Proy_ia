namespace Ers.SqlServerApi.Application;

public sealed record SqlCaseSubjectDto(
    string FullName,
    string? BirthDate,
    int? Age,
    string? Email,
    string? Phone,
    string? Address,
    string? Locality,
    string? Province,
    bool Verified,
    bool Deceased
);

public sealed record SqlCaseFinancialInfoDto(
    int? CreditScore,
    decimal? DebtRatio,
    string? BancarizationLevel,
    int? ActiveLoans,
    int? BouncedChecks,
    string? MonthlyIncomeEstimate,
    string? Observation
);

public sealed record SqlCaseLaborFiscalInfoDto(
    string? TaxStatus,
    string? MainActivity,
    string? EmployerOrCompany,
    string? IncomeBracket,
    int? RegisteredEmployees,
    string? FiscalObservation
);

public sealed record SqlCaseAlertDto(
    string Id,
    string Severity,
    string Title,
    string ShortDescription,
    string Detail,
    string Source,
    string? RelatedVariable,
    string? Recommendation
);

public sealed record SqlCaseScoreFactorDto(
    string Feature,
    string Label,
    string Impact,
    double Weight
);

public sealed record SqlCaseScoreDto(
    double Value,
    string Category,
    double? Confidence,
    string? ModelVersion,
    IReadOnlyList<SqlCaseScoreFactorDto> TopFactors,
    IReadOnlyDictionary<string, double> FeatureContributions
);

public sealed record SqlCaseReasoningDto(
    string Summary,
    string ReasoningSummary,
    string Hypothesis,
    IReadOnlyList<string> EvidenceForReview,
    IReadOnlyList<string> EvidenceAgainstFraud,
    IReadOnlyList<string> Inconsistencies,
    IReadOnlyList<string> MissingEvidence,
    string SuggestedPriority,
    IReadOnlyList<string> SuggestedNextChecks,
    double? Confidence,
    IReadOnlyList<string> UnresolvedQuestions
);

public sealed record SqlCaseFinalAssessmentDto(
    string FinalStatus,
    string FinalPriority,
    string RecommendedAction,
    double? Confidence,
    string SummaryForAnalyst,
    string? EvidenceQuality,
    bool RequiresManualReview,
    bool BlockedByHardRules,
    IReadOnlyList<string> HardRuleReasons
);

public sealed record SqlCaseHistoryDto(
    string Id,
    string Date,
    string Type,
    decimal Amount,
    string Status,
    string Counterpart,
    string Notes
);

public sealed record SqlCaseDashboardResponseDto(
    string CaseId,
    string Identifier,
    string IdentifierType,
    string RequestedAt,
    string Status,
    IReadOnlyDictionary<string, string> ValidationResults,
    IReadOnlyDictionary<string, object> Metadata,
    SqlCaseSubjectDto Subject,
    SqlCaseFinancialInfoDto FinancialInfo,
    SqlCaseLaborFiscalInfoDto LaborFiscalInfo,
    IReadOnlyList<SqlCaseHistoryDto> ClaimsHistory,
    IReadOnlyList<SqlCaseAlertDto> Alerts,
    SqlCaseScoreDto Score,
    SqlCaseReasoningDto Reasoning,
    SqlCaseFinalAssessmentDto FinalAssessment
);

public sealed record SqlCaseGraphNodeDto(
    string Id,
    string Label,
    string Type,
    string RiskLevel,
    IReadOnlyDictionary<string, object?> Metadata
);

public sealed record SqlCaseGraphEdgeDto(
    string Id,
    string Source,
    string Target,
    string RelationshipType,
    string Severity
);

public sealed record SqlCaseGraphResponseDto(
    string CaseId,
    IReadOnlyList<SqlCaseGraphNodeDto> Nodes,
    IReadOnlyList<SqlCaseGraphEdgeDto> Edges
);
