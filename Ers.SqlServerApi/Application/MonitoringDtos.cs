namespace Ers.SqlServerApi.Application;

public sealed record MonitoringRunRequestDto(
    int BatchSize = 200,
    int LookbackDays = 3,
    int MaxBatches = 50,
    string Process = "siniestros_incremental_monitor"
);

public sealed record MonitoringRunResponseDto(
    string Process,
    string Status,
    int ProcessedCount,
    string? LastProcessedClaimId,
    DateTime? LastProcessedAuditDate,
    string? Message,
    bool PersistenceEnabled,
    bool ValidationOnly
);

public sealed record IncrementalWatermarkDto(
    string Process,
    DateTime UltimaFechaProcesada,
    long UltimoIdProcesado,
    DateTime? UltimaEjecucion,
    string Estado,
    string? MensajeError,
    bool PersistenceEnabled
);

public sealed record AntifraudInfrastructureDiagnosticsDto(
    bool MonitoredCasesTableExists,
    bool IncrementalControlTableExists,
    bool DecisionHistoryTableExists,
    bool SourceIndexExists,
    bool PersistenceEnabled,
    string Status,
    string Message,
    IReadOnlyList<string> MissingObjects
);

public sealed record MonitoredCaseListItemDto(
    string CaseId,
    long SinId,
    string? NroSiniestro,
    string? Cliente,
    DateTime? FechaSiniestro,
    double Score,
    string NivelRiesgo,
    string Prioridad,
    string EstadoCaso,
    string? Decision,
    bool? FraudeConfirmado,
    string? PrincipalesAlertas,
    string? ResumenPreview,
    DateTime FechaUltimaEvaluacion,
    bool IsPersisted,
    bool IsPendingAnalysis
);

public sealed record MonitoredCaseDetailDto(
    string CaseId,
    long SinId,
    long? CliId,
    string? Cliente,
    string? PzaNroSol,
    string? PviId,
    string? PsiId,
    string? NroSiniestro,
    string? NroPoliza,
    string? NroCertificado,
    DateTime? FechaSiniestro,
    decimal? MontoReclamo,
    decimal? MontoPagado,
    double Score,
    string NivelRiesgo,
    string Prioridad,
    string EstadoCaso,
    string? Decision,
    bool? FraudeConfirmado,
    string? UsuarioDecision,
    DateTime? FechaDecision,
    string? Comentario,
    string? ResumenPreview,
    IReadOnlyList<RiskAlertDto> Alertas,
    DateTime FechaCreacion,
    DateTime FechaUltimaEvaluacion,
    DateTime SourceAuditDate,
    DateTime? SourceLoadDate,
    string? RecommendedAction,
    CaseModelDto? CaseSnapshot,
    OperationalRiskAnalysisResponseDto? AnalysisSnapshot,
    IReadOnlyList<CaseDecisionHistoryDto> DecisionHistory
);

public sealed record CaseDecisionHistoryDto(
    long HistoryId,
    string ActionType,
    string? Decision,
    bool? FraudeConfirmado,
    string Usuario,
    string? Comentario,
    DateTime FechaAccion
);

public sealed record CaseDecisionRequestDto(
    string Decision,
    string Usuario,
    string? Comentario
);

public sealed record CaseResolutionRequestDto(
    bool FraudeConfirmado,
    string Usuario,
    string? Comentario
);
