namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;

public sealed class PzaVigenciaEntity
{
    public long PzaNroSol { get; set; }
    public string PviNroPol { get; set; } = string.Empty;
    public string PviNroCer { get; set; } = string.Empty;
    public decimal? PviPremio { get; set; }

    public PolizaEntity Poliza { get; set; } = null!;
}
