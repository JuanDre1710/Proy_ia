namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;

public sealed class SiniestroEntity
{
    public long SinId { get; set; }
    public long PsiId { get; set; }
    public string? SinNumero { get; set; }
    public DateTime? SinFechaHora { get; set; }
    public decimal? SinImporte { get; set; }
    public decimal? SinImpReclamo { get; set; }
    public string? VdoIdEstadoSin { get; set; }
    public string? TsiId { get; set; }

    public PolizaSiniestroEntity PolizaSiniestro { get; set; } = null!;
}
