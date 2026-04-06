namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;

public sealed class ExtClienteEntity
{
    public long CliId { get; set; }
    public string? CliIdente { get; set; }
    public int? VdoTipoDoc { get; set; }
    public double? CliNroDoc { get; set; }
    public double? CliCuitl { get; set; }
    public string? CliApellido { get; set; }
    public string? CliNombre { get; set; }
    public string? CliRazonSocial { get; set; }
    public string? CliEmail { get; set; }

    public ICollection<PolizaEntity> PolizasTitular { get; set; } = new List<PolizaEntity>();
    public ICollection<PolizaSiniestroEntity> PolizasSiniestros { get; set; } = new List<PolizaSiniestroEntity>();
}
