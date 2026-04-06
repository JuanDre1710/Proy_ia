using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Queries;

[Keyless]
public sealed class ClientIdentityLookupRow
{
    public int CliId { get; set; }
    public string? CliIdente { get; set; }
    public string? VdoTipoDoc { get; set; }
    public string? CliNroDoc { get; set; }
    public string? CliCuitl { get; set; }
    public string? CliApellido { get; set; }
    public string? CliNombre { get; set; }
    public string? CliRazonSocial { get; set; }
    public string? CliEmail { get; set; }
}
