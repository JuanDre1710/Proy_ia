using Ers.SqlServerAdapter.Contracts;
using Ers.SqlServerAdapter.Infrastructure.Persistence;
using Ers.SqlServerAdapter.Infrastructure.Persistence.Queries;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerAdapter.Infrastructure.DataAccess.Providers;

public sealed class SqlServerIdentityClaimProvider :
    IPersonSearchProvider,
    IClaimQueryProvider,
    ICaseDataProvider,
    IIncrementalClaimProvider
{
    private readonly DevelopmentClaimsDbContext _dbContext;

    public SqlServerIdentityClaimProvider(DevelopmentClaimsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PersonIdentityRecord?> SearchPersonAsync(
        IdentitySearchQuery query,
        CancellationToken cancellationToken = default)
    {
        return await SearchPersonWithoutClaimsAsync(query, cancellationToken);
    }

    public async Task<IReadOnlyList<ClaimSelectionRecord>> ListClaimsByPersonAsync(
        string personId,
        CancellationToken cancellationToken = default)
    {
        var parsedPersonId = int.Parse(personId);
        var rows = await LoadOfficialClaimRowsAsync(
            "AND base.FkCliente = @personId",
            cancellationToken,
            new SqlParameter("@personId", parsedPersonId));

        return rows
            .GroupBy(row => row.PkSiniestro)
            .Select(group =>
            {
                var row = group
                    .OrderByDescending(item => item.SinFechaHora)
                    .ThenByDescending(item => item.FkPolizaVigencia ?? 0)
                    .ThenByDescending(item => item.PkSiniestro)
                    .First();

                return new ClaimSelectionRecord(
                    row.PkSiniestro.ToString(),
                    row.FkCliente.ToString(),
                    row.NroSiniestro ?? row.PkSiniestro.ToString(),
                    row.SinFechaHora,
                    row.VdoIdEstadoSin ?? row.PsiEstado ?? "UNKNOWN",
                    row.VdoIdEstadoSin ?? row.PsiEstado ?? "UNKNOWN",
                    row.SinImporte,
                    row.SinImpReclamo,
                    row.TsiId,
                    row.NroPoliza,
                    row.NroCertificado,
                    row.PzaEstado,
                    row.PsiEstado,
                    row.PzaFecAlta,
                    row.PviPremio
                );
            })
            .OrderByDescending(item => item.OccurredAt)
            .ThenByDescending(item => item.ClaimId)
            .ToList();
    }

    public async Task<ClaimCaseRecord?> GetClaimCaseDataAsync(
        string claimId,
        CancellationToken cancellationToken = default)
    {
        var parsedClaimId = int.Parse(claimId);
        var rows = await LoadOfficialClaimRowsAsync(
            "AND base.PkSiniestro = @claimId",
            cancellationToken,
            new SqlParameter("@claimId", parsedClaimId));

        var row = rows
            .OrderByDescending(item => item.SinFechaHora)
            .ThenByDescending(item => item.FkPolizaVigencia ?? 0)
            .ThenByDescending(item => item.PkSiniestro)
            .FirstOrDefault();

        if (row is null)
        {
            return null;
        }

        return new ClaimCaseRecord(
            row.PkSiniestro.ToString(),
            row.FkCliente.ToString(),
            row.NroSiniestro ?? row.PkSiniestro.ToString(),
            row.NroPoliza,
            row.NroCertificado,
            row.VdoIdEstadoSin ?? row.PsiEstado ?? "UNKNOWN",
            row.TsiId,
            row.SinFechaHora,
            row.SinImporte,
            row.SinImpReclamo,
            BuildDisplayName(row.CliApellido, row.CliNombre, row.CliRazonSocial),
            row.CliNroDoc,
            row.CliCuitl,
            row.CliEmail,
            row.CliFecNac,
            row.EcdCalle,
            row.EcdNumero,
            row.EcdCodPos,
            row.EcdCiudad,
            row.VdoProvincia,
            row.VdoTipoPersona,
            row.VdoIdSexo,
            row.VdoEstCivil,
            row.VdoActividad,
            row.CliEstado,
            row.CliPep,
            row.FkPropuesta,
            row.PzaEstado,
            row.PsiEstado,
            row.PzaFecAlta,
            row.PviPremio,
            row.PviFecIniVig,
            row.PviFecFinVig,
            row.PviEstado,
            row.PzaPremioCalc,
            row.SinContacto,
            row.SinTeContactoSiniestros,
            row.SinCbu,
            row.VdoIdCanalIngreso,
            row.SinDomicilioOcurrencia,
            row.FkPolizaSiniestro.ToString(),
            row.FkPolizaVigencia?.ToString()
        );
    }

    public async Task<IReadOnlyList<IncrementalClaimRecord>> ListIncrementalClaimsAsync(
        DateTime cursorDate,
        long cursorClaimId,
        DateTime readFromDate,
        int batchSize,
        CancellationToken cancellationToken = default)
    {
        var sql = """
            SELECT TOP (@batchSize)
                CAST(sin.SIN_ID AS bigint) AS ClaimId,
                sin.SIN_FECAUD AS AuditDate,
                sin.SIN_FEC_CARGA AS LoadDate
            FROM SINIESTROS sin
            WHERE sin.SIN_FECAUD >= @readFromDate
              AND (
                    sin.SIN_FECAUD > @cursorDate
                    OR (sin.SIN_FECAUD = @cursorDate AND sin.SIN_ID > @cursorClaimId)
                  )
            ORDER BY sin.SIN_FECAUD ASC, sin.SIN_ID ASC
            """;

        var rows = await _dbContext.IncrementalClaimRows
            .FromSqlRaw(
                sql,
                new SqlParameter("@batchSize", batchSize),
                new SqlParameter("@readFromDate", readFromDate),
                new SqlParameter("@cursorDate", cursorDate),
                new SqlParameter("@cursorClaimId", cursorClaimId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new IncrementalClaimRecord(
                row.ClaimId.ToString(),
                row.AuditDate,
                row.LoadDate))
            .ToList();
    }

    private async Task<PersonIdentityRecord?> SearchPersonWithoutClaimsAsync(
        IdentitySearchQuery query,
        CancellationToken cancellationToken)
    {
        var normalizedIdentifier = query.Identifier.Trim();
        var baseSql = """
            SELECT TOP (1)
                CONVERT(nvarchar(50), cli.CLI_ID) AS PersonId,
                CONVERT(nvarchar(200), cli.CLI_APELLIDO) AS CliApellido,
                CONVERT(nvarchar(200), cli.CLI_NOMBRE) AS CliNombre,
                CONVERT(nvarchar(200), cli.CLI_RAZONSOCIAL) AS CliRazonSocial,
                CONVERT(nvarchar(50), cli.VDO_TIPODOC) AS VdoTipoDoc,
                CONVERT(nvarchar(50), cli.CLI_NRODOC) AS CliNroDoc,
                CONVERT(nvarchar(50), cli.CLI_CUITL) AS CliCuitl,
                CONVERT(nvarchar(160), cli.CLI_EMAIL) AS CliEmail,
                cli.CLI_FECNAC AS CliFecNac,
                CONVERT(nvarchar(160), dom.ECD_CALLE) AS EcdCalle,
                CONVERT(nvarchar(50), dom.ECD_NUMERO) AS EcdNumero,
                CONVERT(nvarchar(120), dom.ECD_CIUDAD) AS EcdCiudad,
                CONVERT(nvarchar(120), dom.VDO_PROVINCIA) AS VdoProvincia
            FROM EXT_CLIENTES cli
            OUTER APPLY (
                SELECT TOP (1)
                    dom.ECD_CALLE,
                    dom.ECD_NUMERO,
                    dom.ECD_CIUDAD,
                    dom.VDO_PROVINCIA
                FROM EXT_CLIENTES_DOMICILIO dom
                WHERE dom.CLI_ID = cli.CLI_ID
                  AND dom.ECD_ESTADO = 1
                ORDER BY dom.ECD_ID DESC
            ) dom
            """;

        var documentType = NormalizeDocumentTypeHint(query.DocumentTypeHint);

        var row = await TrySearchPersonByColumnAsync(
            baseSql,
            "cli.CLI_NRODOC = @identifier",
            normalizedIdentifier,
            documentType,
            cancellationToken);

        row ??= await TrySearchPersonByColumnAsync(
            baseSql,
            "cli.CLI_CUITL = @identifier",
            normalizedIdentifier,
            documentType,
            cancellationToken);

        if (row is null)
        {
            return null;
        }

        return new PersonIdentityRecord(
            row.PersonId ?? string.Empty,
            row.CliCuitl ?? row.CliNroDoc ?? normalizedIdentifier,
            string.IsNullOrWhiteSpace(row.CliCuitl) ? "DNI" : "CUIT",
            row.VdoTipoDoc,
            row.CliNroDoc,
            row.CliCuitl,
            BuildDisplayName(row.CliApellido, row.CliNombre, row.CliRazonSocial),
            row.CliEmail,
            row.CliFecNac,
            BuildAddress(row.EcdCalle, row.EcdNumero),
            row.EcdCiudad,
            row.VdoProvincia
        );
    }

    private async Task<PersonWithoutClaimsLookupRow?> TrySearchPersonByColumnAsync(
        string baseSql,
        string identifierPredicate,
        string identifier,
        string? documentType,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            {baseSql}
            WHERE {identifierPredicate}
              AND (@documentType IS NULL OR cli.VDO_TIPODOC = @documentType)
            """;

        return await _dbContext.PersonWithoutClaimsLookup
            .FromSqlRaw(
                sql,
                new SqlParameter("@identifier", identifier),
                new SqlParameter("@documentType", (object?)documentType ?? DBNull.Value))
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<List<OfficialClaimSearchRow>> LoadOfficialClaimRowsAsync(
        string extraWhereClause,
        CancellationToken cancellationToken,
        params SqlParameter[] parameters)
    {
        var sql = BuildOfficialBaseSql(extraWhereClause);
        return await _dbContext.OfficialClaimSearch
            .FromSqlRaw(sql, parameters)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    private static string BuildOfficialBaseSql(string extraWhereClause)
    {
        return $$"""
            SELECT
                sin.SIN_ID AS PkSiniestro,
                psi.PSI_ID AS FkPolizaSiniestro,
                pvi.PVI_ID AS FkPolizaVigencia,
                CONVERT(nvarchar(50), pza.PZA_NROSOL) AS FkPropuesta,
                cli.CLI_ID AS FkCliente,
                CONVERT(nvarchar(80), pvi.PVI_NROPOL) AS NroPoliza,
                CONVERT(nvarchar(80), pvi.PVI_NROCER) AS NroCertificado,
                CONVERT(nvarchar(80), sin.SIN_NUMERO) AS NroSiniestro,
                CONVERT(nvarchar(50), cli.CLI_IDENTE) AS CliIdente,
                CONVERT(nvarchar(50), cli.VDO_TIPODOC) AS VdoTipoDoc,
                CONVERT(nvarchar(50), cli.CLI_NRODOC) AS CliNroDoc,
                CONVERT(nvarchar(50), cli.CLI_CUITL) AS CliCuitl,
                CONVERT(nvarchar(120), cli.CLI_APELLIDO) AS CliApellido,
                CONVERT(nvarchar(120), cli.CLI_NOMBRE) AS CliNombre,
                CONVERT(nvarchar(160), cli.CLI_RAZONSOCIAL) AS CliRazonSocial,
                cli.CLI_FECNAC AS CliFecNac,
                CONVERT(nvarchar(50), cli.VDO_TIPO_PERSONA) AS VdoTipoPersona,
                CONVERT(nvarchar(50), cli.VDO_IDSEXO) AS VdoIdSexo,
                CONVERT(nvarchar(50), cli.VDO_ESTCIVIL) AS VdoEstCivil,
                CONVERT(nvarchar(50), cli.VDO_ACTIVIDAD) AS VdoActividad,
                CONVERT(nvarchar(50), cli.CLI_ESTADO) AS CliEstado,
                CONVERT(nvarchar(50), cli.CLI_PEP) AS CliPep,
                CONVERT(nvarchar(160), cli.CLI_EMAIL) AS CliEmail,
                dom.EcdCalle,
                dom.EcdNumero,
                dom.EcdCodPos,
                dom.EcdCiudad,
                dom.VdoProvincia,
                pza.PZA_FECALTA AS PzaFecAlta,
                CONVERT(nvarchar(50), pza.PZA_ESTADO) AS PzaEstado,
                pza.PZA_PREMIOCALC AS PzaPremioCalc,
                CONVERT(nvarchar(50), pza.PLA_ID) AS PlaId,
                CONVERT(nvarchar(50), pza.VDO_IDCANALVENTA) AS VdoIdCanalVenta,
                CONVERT(nvarchar(50), pza.SUC_VENTA) AS SucVenta,
                CONVERT(nvarchar(50), pza.SUC_ASIG) AS SucAsig,
                CONVERT(nvarchar(50), pza.ZON_ID) AS ZonId,
                pvi.PVI_FECINIVIG AS PviFecIniVig,
                pvi.PVI_FECFINVIG AS PviFecFinVig,
                pvi.PVI_PREMIO AS PviPremio,
                CONVERT(nvarchar(50), pvi.PVI_ESTADO) AS PviEstado,
                pvi.PVI_SOBREPRECIO AS PviSobreprecio,
                CONVERT(nvarchar(50), pvi.PVI_CANCUO) AS PviCancuo,
                CONVERT(nvarchar(50), psi.PSI_ESTADO) AS PsiEstado,
                psi.PSI_FECREAL AS PsiFecReal,
                CONVERT(nvarchar(50), psi.MON_ID) AS MonId,
                CONVERT(nvarchar(50), psi.PMC_ID) AS PmcId,
                CONVERT(nvarchar(50), psi.CIA_ID) AS CiaId,
                CONVERT(nvarchar(50), psi.SUC_ID) AS SucId,
                CONVERT(nvarchar(50), psi.PRO_ID) AS ProId,
                CONVERT(nvarchar(50), psi.LPR_ID) AS LprId,
                sin.SIN_FECHAHORA AS SinFechaHora,
                sin.SIN_IMPORTE AS SinImporte,
                sin.SIN_IMP_RECLAMO AS SinImpReclamo,
                CONVERT(nvarchar(120), sin.SIN_CHEQUE) AS SinCheque,
                CONVERT(nvarchar(160), sin.SIN_CONTACTO) AS SinContacto,
                CONVERT(nvarchar(120), sin.SIN_CBU) AS SinCbu,
                CONVERT(nvarchar(50), sin.VDO_IDESTADO_SIN) AS VdoIdEstadoSin,
                sin.SIN_FECCONTA AS SinFecConta,
                sin.SIN_FEC_CARGA AS SinFecCarga,
                sin.SIN_FEC_OPERACION AS SinFecOperacion,
                CONVERT(nvarchar(80), sin.SIN_TE_CONTACTO_SINIESTROS) AS SinTeContactoSiniestros,
                CONVERT(nvarchar(50), sin.VDO_ID_CANAL_INGRESO) AS VdoIdCanalIngreso,
                CONVERT(nvarchar(200), sin.SIN_DOMICILIO_OCURRENCIA) AS SinDomicilioOcurrencia,
                CONVERT(nvarchar(50), sin.SNL_ID) AS SnlId,
                CONVERT(nvarchar(50), sin.TSI_ID) AS TsiId
            FROM EXT_CLIENTES cli
            OUTER APPLY (
                SELECT TOP (1)
                    CONVERT(nvarchar(160), dom.ECD_CALLE) AS EcdCalle,
                    CONVERT(nvarchar(50), dom.ECD_NUMERO) AS EcdNumero,
                    CONVERT(nvarchar(50), dom.ECD_CODPOS) AS EcdCodPos,
                    CONVERT(nvarchar(120), dom.ECD_CIUDAD) AS EcdCiudad,
                    CONVERT(nvarchar(120), dom.VDO_PROVINCIA) AS VdoProvincia
                FROM EXT_CLIENTES_DOMICILIO dom
                WHERE dom.CLI_ID = cli.CLI_ID
                  AND dom.ECD_ESTADO = 1
                ORDER BY dom.ECD_ID DESC
            ) dom
            INNER JOIN POLIZAS pza
                ON pza.CLI_IDTITULAR = cli.CLI_ID
            OUTER APPLY (
                SELECT TOP (1)
                    pviInner.PVI_ID,
                    pviInner.PVI_NROPOL,
                    pviInner.PVI_NROCER,
                    pviInner.PVI_FECINIVIG,
                    pviInner.PVI_FECFINVIG,
                    pviInner.PVI_PREMIO,
                    pviInner.PVI_ESTADO,
                    pviInner.PVI_SOBREPRECIO,
                    pviInner.PVI_CANCUO
                FROM PZA_VIGENCIAS pviInner
                WHERE pviInner.PZA_NROSOL = pza.PZA_NROSOL
                ORDER BY
                    ISNULL(pviInner.PVI_FECFINVIG, pviInner.PVI_FECINIVIG) DESC,
                    pviInner.PVI_ID DESC
            ) pvi
            INNER JOIN POLIZAS_SINIESTROS psi
                ON psi.PZA_NROSOL = pza.PZA_NROSOL
               AND psi.CLI_ID = cli.CLI_ID
            INNER JOIN SINIESTROS sin
                ON sin.PSI_ID = psi.PSI_ID
            CROSS APPLY (
                SELECT
                    sin.SIN_ID AS PkSiniestro,
                    psi.PSI_ID AS FkPolizaSiniestro,
                    pvi.PVI_ID AS FkPolizaVigencia,
                    pza.PZA_NROSOL AS FkPropuesta,
                    cli.CLI_ID AS FkCliente,
                    CONVERT(nvarchar(50), cli.VDO_TIPODOC) AS VdoTipoDoc,
                    CONVERT(nvarchar(50), cli.CLI_NRODOC) AS CliNroDoc,
                    CONVERT(nvarchar(50), cli.CLI_CUITL) AS CliCuitl,
                    sin.SIN_FECHAHORA AS SinFechaHora
            ) base
            WHERE sin.SIN_ID IS NOT NULL
            {{extraWhereClause}}
            """;
    }

    private static string? NormalizeDocumentTypeHint(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return null;
        }

        return int.TryParse(rawValue.Trim(), out var numericCode)
            ? numericCode.ToString()
            : null;
    }

    private static string BuildDisplayName(string? apellido, string? nombre, string? razonSocial)
    {
        var fullName = $"{apellido} {nombre}".Trim();
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            return fullName;
        }

        return !string.IsNullOrWhiteSpace(razonSocial) ? razonSocial : "Cliente sin nombre";
    }

    private static string? BuildAddress(string? street, string? number)
    {
        var streetValue = street?.Trim();
        var numberValue = number?.Trim();

        if (string.IsNullOrWhiteSpace(streetValue) && string.IsNullOrWhiteSpace(numberValue))
        {
            return null;
        }

        return string.Join(" ", new[] { streetValue, numberValue }.Where(value => !string.IsNullOrWhiteSpace(value)));
    }
}
