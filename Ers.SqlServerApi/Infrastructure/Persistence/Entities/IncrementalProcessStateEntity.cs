namespace Ers.SqlServerApi.Infrastructure.Persistence.Entities;

public sealed class IncrementalProcessStateEntity
{
    public string ProcessName { get; set; } = string.Empty;
    public DateTime UltimaFechaProcesada { get; set; }
    public long UltimoIdProcesado { get; set; }
    public DateTime? UltimaEjecucion { get; set; }
    public string Estado { get; set; } = "pending";
    public string? MensajeError { get; set; }
}
