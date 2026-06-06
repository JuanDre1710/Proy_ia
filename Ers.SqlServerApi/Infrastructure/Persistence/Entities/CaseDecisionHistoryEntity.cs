namespace Ers.SqlServerApi.Infrastructure.Persistence.Entities;

public sealed class CaseDecisionHistoryEntity
{
    public long HistoryId { get; set; }
    public Guid CaseId { get; set; }
    public MonitoredCaseEntity Case { get; set; } = null!;
    public long SinId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string? Decision { get; set; }
    public bool? FraudeConfirmado { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string? Comentario { get; set; }
    public DateTime FechaAccion { get; set; }
}
