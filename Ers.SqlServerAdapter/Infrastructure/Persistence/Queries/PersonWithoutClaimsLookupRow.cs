using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Queries;

[Keyless]
public sealed class PersonWithoutClaimsLookupRow
{
    public string? PersonId { get; set; }
    public string? CliApellido { get; set; }
    public string? CliNombre { get; set; }
    public string? CliRazonSocial { get; set; }
    public string? VdoTipoDoc { get; set; }
    public string? CliNroDoc { get; set; }
    public string? CliCuitl { get; set; }
    public string? CliEmail { get; set; }
    public DateTime? CliFecNac { get; set; }
    public string? EcdCalle { get; set; }
    public string? EcdNumero { get; set; }
    public string? EcdCiudad { get; set; }
    public string? VdoProvincia { get; set; }
}
