using System.Data;
using System.Text.Json;
using Ers.SqlServerAdapter.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Application;

public sealed class CaseInboxService
{
    private const string PlaceholderSummary = "Caso pendiente de analisis automatico. Se registro decision operativa manual.";

    private readonly DevelopmentClaimsDbContext _claimsDbContext;
    private readonly AntifraudInfrastructureStatusService _infrastructureStatusService;
    private readonly CaseAssemblyService _caseAssemblyService;
    private readonly OperationalRiskAnalysisService _riskAnalysisService;

    public CaseInboxService(
        DevelopmentClaimsDbContext claimsDbContext,
        AntifraudInfrastructureStatusService infrastructureStatusService,
        CaseAssemblyService caseAssemblyService,
        OperationalRiskAnalysisService riskAnalysisService)
    {
        _claimsDbContext = claimsDbContext;
        _infrastructureStatusService = infrastructureStatusService;
        _caseAssemblyService = caseAssemblyService;
        _riskAnalysisService = riskAnalysisService;
    }

    public async Task<IReadOnlyList<MonitoredCaseListItemDto>> ListPendingAsync(
        int take,
        CancellationToken cancellationToken = default)
    {
        var diagnostics = await _infrastructureStatusService.GetDiagnosticsAsync(cancellationToken);
        var sql = diagnostics.MonitoredCasesTableExists
            ? BuildInboxSql(includeOperationalTable: true)
            : BuildInboxSql(includeOperationalTable: false);

        var connectionString =
            _claimsDbContext.Database.GetConnectionString()
            ?? _claimsDbContext.Database.GetDbConnection().ConnectionString;

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("La cadena de conexion DefaultConnection no esta configurada.");
        }

        var items = new List<MonitoredCaseListItemDto>();

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.Add(new SqlParameter("@take", SqlDbType.Int) { Value = take });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var alerts = ReadString(reader, 10);
            var topAlerts = ParseTopAlerts(alerts);
            var caseId = ReadString(reader, 0);
            var sinId = ReadInt64(reader, 1);
            var isPersisted = !string.IsNullOrWhiteSpace(caseId);
            var isPendingAnalysis = !isPersisted;

            items.Add(new MonitoredCaseListItemDto(
                caseId ?? $"SIN-{sinId}",
                sinId,
                ReadString(reader, 2),
                ReadString(reader, 3),
                ReadNullableDateTime(reader, 4),
                ReadDouble(reader, 5),
                ReadString(reader, 6) ?? "sin_analizar",
                ReadString(reader, 7) ?? "media",
                ReadString(reader, 8) ?? "pendiente",
                ReadString(reader, 9),
                ReadNullableBoolean(reader, 11),
                topAlerts.Count == 0 ? null : string.Join("; ", topAlerts.Take(3)),
                ReadString(reader, 12) ?? "Siniestro pendiente de analisis automatico.",
                ReadNullableDateTime(reader, 13) ?? DateTime.UtcNow,
                isPersisted,
                isPendingAnalysis));
        }

        await EnrichPendingItemsAsync(items, cancellationToken);
        return items;
    }

    private async Task EnrichPendingItemsAsync(
        List<MonitoredCaseListItemDto> items,
        CancellationToken cancellationToken)
    {
        for (var index = 0; index < items.Count; index++)
        {
            var item = items[index];
            if (!RequiresRealtimeAnalysis(item))
            {
                continue;
            }

            var caseModel = await _caseAssemblyService.BuildDomainModelAsync(
                new BuildCaseFromClaimRequestDto(item.SinId.ToString()),
                cancellationToken);

            if (caseModel is null)
            {
                continue;
            }

            var analysis = _riskAnalysisService.Analyze(caseModel);
            var alertTitles = analysis.Alerts.Select(alert => alert.Title).Take(3).ToList();
            var (nivelRiesgo, prioridad) = ResolveInboxClassification(analysis);

            items[index] = item with
            {
                Score = analysis.Score,
                NivelRiesgo = nivelRiesgo,
                Prioridad = prioridad,
                PrincipalesAlertas = alertTitles.Count == 0 ? null : string.Join("; ", alertTitles),
                ResumenPreview = analysis.SummaryForAnalyst,
                FechaUltimaEvaluacion = item.FechaUltimaEvaluacion
            };
        }
    }

    private static bool RequiresRealtimeAnalysis(MonitoredCaseListItemDto item)
    {
        if (item.IsPendingAnalysis)
        {
            return true;
        }

        var hasPlaceholderSummary = string.Equals(
            item.ResumenPreview?.Trim(),
            PlaceholderSummary,
            StringComparison.OrdinalIgnoreCase);
        var hasNoAlerts = string.IsNullOrWhiteSpace(item.PrincipalesAlertas);
        var looksLikePlaceholderRisk =
            item.Score <= 0 &&
            (string.Equals(item.NivelRiesgo, "normal", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(item.NivelRiesgo, "sin_analizar", StringComparison.OrdinalIgnoreCase));

        return hasPlaceholderSummary || (looksLikePlaceholderRisk && hasNoAlerts);
    }

    private static (string NivelRiesgo, string Prioridad) ResolveInboxClassification(
        OperationalRiskAnalysisResponseDto analysis)
    {
        if (!analysis.IsEvaluable)
        {
            return ("no_evaluable", "alta");
        }

        if (analysis.Score >= 70 || string.Equals(analysis.RiskClass, "Sospechoso", StringComparison.OrdinalIgnoreCase))
        {
            return ("critico", "critica");
        }

        if (analysis.Score >= 35)
        {
            return ("medio", "alta");
        }

        if (analysis.Score >= 20)
        {
            return ("leve", "media");
        }

        return ("normal", "baja");
    }

    private static string BuildInboxSql(bool includeOperationalTable)
    {
        if (!includeOperationalTable)
        {
            return """
                WITH candidate_siniestros AS (
                    SELECT TOP (@take)
                        sin.SIN_ID,
                        sin.PSI_ID,
                        sin.SIN_NUMERO,
                        sin.SIN_FECHAHORA,
                        sin.SIN_FECAUD,
                        sin.SIN_FEC_CARGA
                    FROM SINIESTROS sin
                    ORDER BY sin.SIN_ID DESC
                )
                SELECT
                    CAST(NULL AS nvarchar(36)) AS CASE_ID,
                    sin.SIN_ID,
                    CONVERT(nvarchar(80), sin.SIN_NUMERO) COLLATE DATABASE_DEFAULT AS NRO_SINIESTRO,
                    COALESCE(
                        NULLIF(
                            LTRIM(RTRIM(CONCAT(
                                CONVERT(nvarchar(200), cli.CLI_APELLIDO),
                                N' ',
                                CONVERT(nvarchar(200), cli.CLI_NOMBRE)
                            ))) COLLATE DATABASE_DEFAULT,
                            N''
                        ),
                        NULLIF(CONVERT(nvarchar(200), cli.CLI_RAZONSOCIAL) COLLATE DATABASE_DEFAULT, N''),
                        N'Cliente sin nombre'
                    ) COLLATE DATABASE_DEFAULT AS CLIENTE,
                    sin.SIN_FECHAHORA AS FECHA_SINIESTRO,
                    CAST(0.0 AS float) AS SCORE,
                    N'sin_analizar' AS NIVEL_RIESGO,
                    N'media' AS PRIORIDAD,
                    N'pendiente' AS ESTADO_CASO,
                    CAST(NULL AS nvarchar(30)) AS DECISION,
                    N'[]' AS ALERTAS,
                    CAST(NULL AS bit) AS FRAUDE_CONFIRMADO,
                    N'Siniestro pendiente de analisis automatico.' AS RESUMEN_PREVIEW,
                    COALESCE(sin.SIN_FECAUD, sin.SIN_FEC_CARGA, sin.SIN_FECHAHORA, SYSUTCDATETIME()) AS FECHA_ULTIMA_EVALUACION
                FROM candidate_siniestros sin
                LEFT JOIN POLIZAS_SINIESTROS psi
                    ON psi.PSI_ID = sin.PSI_ID
                LEFT JOIN EXT_CLIENTES cli
                    ON cli.CLI_ID = psi.CLI_ID
                ORDER BY sin.SIN_ID DESC;
                """;
        }

        return """
            WITH open_operational_cases AS (
                SELECT TOP (@take)
                    af.SIN_ID
                FROM dbo.AF_MONITORED_CASES af
                WHERE af.ESTADO_CASO IN (N'pendiente', N'en_revision')
                ORDER BY COALESCE(af.PRIORIDAD_ORDEN, 0) DESC,
                         COALESCE(af.FECHA_ULTIMA_EVALUACION, af.FECHA_CREACION, SYSUTCDATETIME()) DESC,
                         af.SIN_ID DESC
            ),
            recent_unanalyzed_siniestros AS (
                SELECT TOP (@take)
                    sin.SIN_ID
                FROM SINIESTROS sin
                LEFT JOIN dbo.AF_MONITORED_CASES af
                    ON af.SIN_ID = sin.SIN_ID
                WHERE af.SIN_ID IS NULL
                ORDER BY sin.SIN_ID DESC
            ),
            candidate_siniestros AS (
                SELECT SIN_ID FROM open_operational_cases
                UNION
                SELECT SIN_ID FROM recent_unanalyzed_siniestros
            )
            SELECT TOP (@take)
                CONVERT(nvarchar(36), af.CASE_ID) AS CASE_ID,
                sin.SIN_ID,
                COALESCE(
                    af.NRO_SINIESTRO COLLATE DATABASE_DEFAULT,
                    CONVERT(nvarchar(80), sin.SIN_NUMERO) COLLATE DATABASE_DEFAULT
                ) COLLATE DATABASE_DEFAULT AS NRO_SINIESTRO,
                COALESCE(
                    af.CLIENT_DISPLAY_NAME COLLATE DATABASE_DEFAULT,
                    NULLIF(
                        LTRIM(RTRIM(CONCAT(
                            CONVERT(nvarchar(200), cli.CLI_APELLIDO),
                            N' ',
                            CONVERT(nvarchar(200), cli.CLI_NOMBRE)
                        ))) COLLATE DATABASE_DEFAULT,
                        N''
                    ),
                    NULLIF(CONVERT(nvarchar(200), cli.CLI_RAZONSOCIAL) COLLATE DATABASE_DEFAULT, N''),
                    N'Cliente sin nombre'
                ) COLLATE DATABASE_DEFAULT AS CLIENTE,
                COALESCE(af.FECHA_SINIESTRO, sin.SIN_FECHAHORA) AS FECHA_SINIESTRO,
                COALESCE(af.SCORE, 0.0) AS SCORE,
                COALESCE(af.NIVEL_RIESGO COLLATE DATABASE_DEFAULT, N'sin_analizar') AS NIVEL_RIESGO,
                CASE
                    WHEN af.PRIORIDAD IS NULL THEN N'media'
                    WHEN PATINDEX('%[^0-9]%', CONVERT(nvarchar(30), af.PRIORIDAD)) = 0 THEN
                        CASE
                            WHEN CONVERT(int, af.PRIORIDAD) >= 400 THEN N'critica'
                            WHEN CONVERT(int, af.PRIORIDAD) >= 300 THEN N'alta'
                            WHEN CONVERT(int, af.PRIORIDAD) >= 200 THEN N'media'
                            ELSE N'baja'
                        END
                    ELSE COALESCE(CONVERT(nvarchar(30), af.PRIORIDAD) COLLATE DATABASE_DEFAULT, N'media')
                END AS PRIORIDAD,
                COALESCE(af.ESTADO_CASO COLLATE DATABASE_DEFAULT, N'pendiente') AS ESTADO_CASO,
                af.DECISION COLLATE DATABASE_DEFAULT AS DECISION,
                COALESCE(af.ALERTAS COLLATE DATABASE_DEFAULT, N'[]') AS ALERTAS,
                af.FRAUDE_CONFIRMADO,
                COALESCE(
                    af.RESUMEN_PREVIEW COLLATE DATABASE_DEFAULT,
                    N'Siniestro pendiente de analisis automatico.'
                ) AS RESUMEN_PREVIEW,
                COALESCE(af.FECHA_ULTIMA_EVALUACION, sin.SIN_FECAUD, sin.SIN_FEC_CARGA, sin.SIN_FECHAHORA, SYSUTCDATETIME()) AS FECHA_ULTIMA_EVALUACION
            FROM candidate_siniestros candidates
            INNER JOIN SINIESTROS sin
                ON sin.SIN_ID = candidates.SIN_ID
            LEFT JOIN dbo.AF_MONITORED_CASES af
                ON af.SIN_ID = sin.SIN_ID
            LEFT JOIN POLIZAS_SINIESTROS psi
                ON psi.PSI_ID = sin.PSI_ID
            LEFT JOIN EXT_CLIENTES cli
                ON cli.CLI_ID = psi.CLI_ID
            ORDER BY
                CASE
                    WHEN af.ESTADO_CASO = N'en_revision' THEN 2
                    WHEN af.ESTADO_CASO = N'pendiente' THEN 1
                    ELSE 0
                END DESC,
                COALESCE(af.PRIORIDAD_ORDEN, 0) DESC,
                COALESCE(af.FECHA_ULTIMA_EVALUACION, sin.SIN_FECAUD, sin.SIN_FEC_CARGA, sin.SIN_FECHAHORA, SYSUTCDATETIME()) DESC,
                sin.SIN_ID DESC;
            """;
    }

    private static List<string> ParseTopAlerts(string? alertsJson)
    {
        if (string.IsNullOrWhiteSpace(alertsJson))
        {
            return new List<string>();
        }

        try
        {
            using var document = JsonDocument.Parse(alertsJson);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return new List<string>();
            }

            return document.RootElement
                .EnumerateArray()
                .Select(item =>
                {
                    if (item.TryGetProperty("title", out var title) && title.ValueKind == JsonValueKind.String)
                    {
                        return title.GetString();
                    }

                    if (item.TryGetProperty("Title", out var titlePascal) && titlePascal.ValueKind == JsonValueKind.String)
                    {
                        return titlePascal.GetString();
                    }

                    return null;
                })
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item!)
                .ToList();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static string? ReadString(SqlDataReader reader, int ordinal)
        => reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);

    private static DateTime? ReadNullableDateTime(SqlDataReader reader, int ordinal)
        => reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);

    private static bool? ReadNullableBoolean(SqlDataReader reader, int ordinal)
        => reader.IsDBNull(ordinal) ? null : reader.GetBoolean(ordinal);

    private static double ReadDouble(SqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return 0d;
        }

        var value = reader.GetValue(ordinal);
        return value switch
        {
            double doubleValue => doubleValue,
            float floatValue => floatValue,
            decimal decimalValue => (double)decimalValue,
            int intValue => intValue,
            long longValue => longValue,
            _ => Convert.ToDouble(value)
        };
    }

    private static long ReadInt64(SqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return 0L;
        }

        var value = reader.GetValue(ordinal);
        return value switch
        {
            long longValue => longValue,
            int intValue => intValue,
            short shortValue => shortValue,
            decimal decimalValue => (long)decimalValue,
            _ => Convert.ToInt64(value)
        };
    }
}
