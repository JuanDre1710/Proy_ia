using Ers.SqlServerAdapter.Contracts;
using Ers.SqlServerAdapter.Infrastructure.Persistence;
using Ers.SqlServerAdapter.Infrastructure.Persistence.Queries;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerAdapter.Infrastructure.DataAccess.Providers;

public sealed class SqlServerIdentityClaimProvider :
    IPersonSearchProvider,
    IClaimQueryProvider,
    ICaseDataProvider
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
        var normalizedIdentifier = query.Identifier.Trim();
        var normalizedDocumentType = query.DocumentTypeHint?.Trim();
        var sql = """
            SELECT TOP (1)
                cli.CLI_ID AS CliId,
                CONVERT(nvarchar(100), cli.CLI_IDENTE) AS CliIdente,
                CONVERT(nvarchar(50), cli.VDO_TIPODOC) AS VdoTipoDoc,
                CONVERT(nvarchar(50), cli.CLI_NRODOC) AS CliNroDoc,
                CONVERT(nvarchar(50), cli.CLI_CUITL) AS CliCuitl,
                CONVERT(nvarchar(120), cli.CLI_APELLIDO) AS CliApellido,
                CONVERT(nvarchar(120), cli.CLI_NOMBRE) AS CliNombre,
                CONVERT(nvarchar(160), cli.CLI_RAZONSOCIAL) AS CliRazonSocial,
                CONVERT(nvarchar(160), cli.CLI_EMAIL) AS CliEmail
            FROM EXT_CLIENTES cli
            WHERE
                (
                    CONVERT(nvarchar(50), cli.CLI_NRODOC) = @identifier
                    OR CONVERT(nvarchar(50), cli.CLI_CUITL) = @identifier
                )
                AND (@documentType IS NULL OR CONVERT(nvarchar(50), cli.VDO_TIPODOC) = @documentType)
            """;

        var rows = await _dbContext.ClientIdentityLookup
            .FromSqlRaw(
                sql,
                new SqlParameter("@identifier", normalizedIdentifier),
                new SqlParameter("@documentType", (object?)TryParseDocumentTypeCode(normalizedDocumentType)?.ToString() ?? DBNull.Value))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var row = rows.FirstOrDefault();
        if (row is null)
        {
            return null;
        }

        return new PersonIdentityRecord(
            row.CliId.ToString(),
            row.CliCuitl ?? row.CliNroDoc ?? normalizedIdentifier,
            string.IsNullOrWhiteSpace(row.CliCuitl) ? "DNI" : "CUIT",
            row.VdoTipoDoc,
            row.CliNroDoc,
            row.CliCuitl,
            BuildDisplayName(row.CliApellido, row.CliNombre, row.CliRazonSocial),
            row.CliEmail
        );
    }

    public async Task<IReadOnlyList<ClaimSelectionRecord>> ListClaimsByPersonAsync(
        string personId,
        CancellationToken cancellationToken = default)
    {
        var parsedPersonId = int.Parse(personId);
        var sql = """
            SELECT
                sin.SIN_ID AS ClaimId,
                psi.CLI_ID AS PersonId,
                CONVERT(nvarchar(80), sin.SIN_NUMERO) AS ClaimNumber,
                sin.SIN_FECHAHORA AS OccurredAt,
                COALESCE(CONVERT(nvarchar(50), sin.VDO_IDESTADO_SIN), CONVERT(nvarchar(50), psi.PSI_ESTADO), N'UNKNOWN') AS StatusCode,
                COALESCE(CONVERT(nvarchar(50), sin.VDO_IDESTADO_SIN), CONVERT(nvarchar(50), psi.PSI_ESTADO), N'UNKNOWN') AS StatusLabel,
                sin.SIN_IMPORTE AS ClaimAmount,
                sin.SIN_IMP_RECLAMO AS ClaimedAmount,
                CONVERT(nvarchar(50), sin.TSI_ID) AS ClaimTypeId,
                CONVERT(nvarchar(80), pvi.PVI_NROPOL) AS PolicyNumber,
                CONVERT(nvarchar(80), pvi.PVI_NROCER) AS CertificateNumber,
                CONVERT(nvarchar(50), pza.PZA_ESTADO) AS PolicyStatus,
                CONVERT(nvarchar(50), psi.PSI_ESTADO) AS LinkStatus,
                pza.PZA_FECALTA AS PolicyCreatedAt,
                pvi.PVI_PREMIO AS PolicyPremium
            FROM POLIZAS_SINIESTROS psi
            INNER JOIN SINIESTROS sin ON sin.PSI_ID = psi.PSI_ID
            INNER JOIN POLIZAS pza ON pza.PZA_NROSOL = psi.PZA_NROSOL
            LEFT JOIN PZA_VIGENCIAS pvi ON pvi.PZA_NROSOL = pza.PZA_NROSOL
            WHERE psi.CLI_ID = @personId
            ORDER BY sin.SIN_FECHAHORA DESC, sin.SIN_ID DESC
            """;

        var rows = await _dbContext.ClaimSelectionLookup
            .FromSqlRaw(sql, new SqlParameter("@personId", parsedPersonId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new ClaimSelectionRecord(
                row.ClaimId.ToString(),
                row.PersonId.ToString(),
                row.ClaimNumber ?? row.ClaimId.ToString(),
                row.OccurredAt,
                row.StatusCode ?? "UNKNOWN",
                row.StatusLabel ?? "UNKNOWN",
                row.ClaimAmount,
                row.ClaimedAmount,
                row.ClaimTypeId,
                row.PolicyNumber,
                row.CertificateNumber,
                row.PolicyStatus,
                row.LinkStatus,
                row.PolicyCreatedAt,
                row.PolicyPremium
            ))
            .ToList();
    }

    public async Task<ClaimCaseRecord?> GetClaimCaseDataAsync(
        string claimId,
        CancellationToken cancellationToken = default)
    {
        var parsedClaimId = long.Parse(claimId);
        var sql = """
            SELECT TOP (1)
                sin.SIN_ID AS ClaimId,
                cli.CLI_ID AS PersonId,
                CONVERT(nvarchar(80), sin.SIN_NUMERO) AS ClaimNumber,
                CONVERT(nvarchar(80), pvi.PVI_NROPOL) AS PolicyNumber,
                CONVERT(nvarchar(80), pvi.PVI_NROCER) AS CertificateNumber,
                COALESCE(CONVERT(nvarchar(50), sin.VDO_IDESTADO_SIN), CONVERT(nvarchar(50), psi.PSI_ESTADO), N'UNKNOWN') AS StatusCode,
                CONVERT(nvarchar(50), sin.TSI_ID) AS ClaimTypeId,
                sin.SIN_FECHAHORA AS OccurredAt,
                sin.SIN_IMPORTE AS ClaimAmount,
                sin.SIN_IMP_RECLAMO AS ClaimedAmount,
                LTRIM(RTRIM(COALESCE(CONVERT(nvarchar(120), cli.CLI_APELLIDO), N'') + N' ' + COALESCE(CONVERT(nvarchar(120), cli.CLI_NOMBRE), N''))) AS PersonDisplayName,
                CONVERT(nvarchar(50), cli.CLI_NRODOC) AS DocumentNumber,
                CONVERT(nvarchar(50), cli.CLI_CUITL) AS TaxId,
                CONVERT(nvarchar(160), cli.CLI_EMAIL) AS Email,
                CONVERT(nvarchar(50), pza.PZA_ESTADO) AS PolicyStatus,
                CONVERT(nvarchar(50), psi.PSI_ESTADO) AS LinkStatus,
                pza.PZA_FECALTA AS PolicyCreatedAt,
                pvi.PVI_PREMIO AS PolicyPremium
            FROM SINIESTROS sin
            INNER JOIN POLIZAS_SINIESTROS psi ON psi.PSI_ID = sin.PSI_ID
            INNER JOIN EXT_CLIENTES cli ON cli.CLI_ID = psi.CLI_ID
            INNER JOIN POLIZAS pza ON pza.PZA_NROSOL = psi.PZA_NROSOL
            LEFT JOIN PZA_VIGENCIAS pvi ON pvi.PZA_NROSOL = pza.PZA_NROSOL
            WHERE sin.SIN_ID = @claimId
            """;

        var rows = await _dbContext.ClaimCaseLookup
            .FromSqlRaw(sql, new SqlParameter("@claimId", parsedClaimId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var row = rows.FirstOrDefault();
        if (row is null)
        {
            return null;
        }

        return new ClaimCaseRecord(
            row.ClaimId.ToString(),
            row.PersonId.ToString(),
            row.ClaimNumber ?? row.ClaimId.ToString(),
            row.PolicyNumber,
            row.CertificateNumber,
            row.StatusCode ?? "UNKNOWN",
            row.ClaimTypeId,
            row.OccurredAt,
            row.ClaimAmount,
            row.ClaimedAmount,
            BuildDisplayNameFromSql(row.PersonDisplayName),
            row.DocumentNumber,
            row.TaxId,
            row.Email,
            row.PolicyStatus,
            row.LinkStatus,
            row.PolicyCreatedAt,
            row.PolicyPremium
        );
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

    private static int? TryParseDocumentTypeCode(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return null;
        }

        return int.TryParse(rawValue, out var parsedValue) ? parsedValue : null;
    }

    private static string BuildDisplayNameFromSql(string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            return value.Trim();
        }

        return "Cliente sin nombre";
    }
}
