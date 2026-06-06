namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;

public sealed class PolizaSiniestroEntity
{
    public long PsiId { get; set; }
    public long PzaNroSol { get; set; }
    public long CliId { get; set; }
    public string? PsiEstado { get; set; }

    public PolizaEntity Poliza { get; set; } = null!;
    public ExtClienteEntity Cliente { get; set; } = null!;
    public ICollection<SiniestroEntity> Siniestros { get; set; } = new List<SiniestroEntity>();
}
