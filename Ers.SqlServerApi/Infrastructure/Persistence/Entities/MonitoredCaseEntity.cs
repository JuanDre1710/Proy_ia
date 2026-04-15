namespace Ers.SqlServerApi.Infrastructure.Persistence.Entities;

public sealed class MonitoredCaseEntity
{
    public Guid CaseId { get; set; }
    public long SinId { get; set; }
    public long? CliId { get; set; }
    public string? ClientDisplayName { get; set; }
    public string? PzaNroSol { get; set; }
    public string? PviId { get; set; }
    public string? PsiId { get; set; }
    public string? NroSiniestro { get; set; }
    public string? NroPoliza { get; set; }
    public string? NroCertificado { get; set; }
    public DateTime? FechaSiniestro { get; set; }
    public decimal? MontoReclamo { get; set; }
    public decimal? MontoPagado { get; set; }
    public double Score { get; set; }
    public string NivelRiesgo { get; set; } = "normal";
    public string Prioridad { get; set; } = "baja";
    public int PrioridadOrden { get; set; }
    public string EstadoCaso { get; set; } = "pendiente";
    public string? Decision { get; set; }
    public bool? FraudeConfirmado { get; set; }
    public string? UsuarioDecision { get; set; }
    public DateTime? FechaDecision { get; set; }
    public string? Comentario { get; set; }
    public string? ResumenPreview { get; set; }
    public string Alertas { get; set; } = "[]";
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaUltimaEvaluacion { get; set; }
    public string HashDatos { get; set; } = string.Empty;
    public DateTime SourceAuditDate { get; set; }
    public DateTime? SourceLoadDate { get; set; }
    public string? RecommendedAction { get; set; }
    public string CaseSnapshotJson { get; set; } = "{}";
    public string AnalysisSnapshotJson { get; set; } = "{}";
    public ICollection<CaseDecisionHistoryEntity> DecisionHistory { get; set; } = new List<CaseDecisionHistoryEntity>();
}
