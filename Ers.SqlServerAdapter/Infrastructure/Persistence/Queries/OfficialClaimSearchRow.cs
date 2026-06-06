using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Queries;

[Keyless]
public sealed class OfficialClaimSearchRow
{
    public int PkSiniestro { get; set; }
    public int FkPolizaSiniestro { get; set; }
    public int? FkPolizaVigencia { get; set; }
    public string? FkPropuesta { get; set; }
    public int FkCliente { get; set; }
    public string? NroPoliza { get; set; }
    public string? NroCertificado { get; set; }
    public string? NroSiniestro { get; set; }
    public string? CliIdente { get; set; }
    public string? VdoTipoDoc { get; set; }
    public string? CliNroDoc { get; set; }
    public string? CliCuitl { get; set; }
    public string? CliApellido { get; set; }
    public string? CliNombre { get; set; }
    public string? CliRazonSocial { get; set; }
    public DateTime? CliFecNac { get; set; }
    public string? VdoTipoPersona { get; set; }
    public string? VdoIdSexo { get; set; }
    public string? VdoEstCivil { get; set; }
    public string? VdoActividad { get; set; }
    public string? CliEstado { get; set; }
    public string? CliPep { get; set; }
    public string? CliEmail { get; set; }
    public string? EcdCalle { get; set; }
    public string? EcdNumero { get; set; }
    public string? EcdCodPos { get; set; }
    public string? EcdCiudad { get; set; }
    public string? VdoProvincia { get; set; }
    public DateTime? PzaFecAlta { get; set; }
    public string? PzaEstado { get; set; }
    public decimal? PzaPremioCalc { get; set; }
    public string? PlaId { get; set; }
    public string? VdoIdCanalVenta { get; set; }
    public string? SucVenta { get; set; }
    public string? SucAsig { get; set; }
    public string? ZonId { get; set; }
    public DateTime? PviFecIniVig { get; set; }
    public DateTime? PviFecFinVig { get; set; }
    public decimal? PviPremio { get; set; }
    public string? PviEstado { get; set; }
    public decimal? PviSobreprecio { get; set; }
    public string? PviCancuo { get; set; }
    public string? PsiEstado { get; set; }
    public DateTime? PsiFecReal { get; set; }
    public string? MonId { get; set; }
    public string? PmcId { get; set; }
    public string? CiaId { get; set; }
    public string? SucId { get; set; }
    public string? ProId { get; set; }
    public string? LprId { get; set; }
    public DateTime? SinFechaHora { get; set; }
    public decimal? SinImporte { get; set; }
    public decimal? SinImpReclamo { get; set; }
    public string? SinCheque { get; set; }
    public string? SinContacto { get; set; }
    public string? SinCbu { get; set; }
    public string? VdoIdEstadoSin { get; set; }
    public DateTime? SinFecConta { get; set; }
    public DateTime? SinFecCarga { get; set; }
    public DateTime? SinFecOperacion { get; set; }
    public string? SinTeContactoSiniestros { get; set; }
    public string? VdoIdCanalIngreso { get; set; }
    public string? SinDomicilioOcurrencia { get; set; }
    public string? SnlId { get; set; }
    public string? TsiId { get; set; }
}
