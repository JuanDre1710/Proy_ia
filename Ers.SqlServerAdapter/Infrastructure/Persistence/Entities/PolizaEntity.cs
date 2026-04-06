namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;

public sealed class PolizaEntity
{
    public long PzaNroSol { get; set; }
    public long CliIdTitular { get; set; }
    public DateTime? PzaFecAlta { get; set; }
    public string? PzaEstado { get; set; }

    public ExtClienteEntity Titular { get; set; } = null!;
    public ICollection<PzaVigenciaEntity> Vigencias { get; set; } = new List<PzaVigenciaEntity>();
    public ICollection<PolizaSiniestroEntity> PolizaSiniestros { get; set; } = new List<PolizaSiniestroEntity>();
}
