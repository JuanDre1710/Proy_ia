using System.Data;
using Ers.SqlServerApi.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Application;

public sealed class AntifraudInfrastructureStatusService
{
    private static readonly string[] RequiredMonitoredCasesColumns =
    {
        "CLIENT_DISPLAY_NAME",
        "PRIORIDAD_ORDEN",
        "RESUMEN_PREVIEW",
        "SOURCE_AUDIT_DATE",
        "SOURCE_LOAD_DATE",
        "RECOMMENDED_ACTION",
        "CASE_SNAPSHOT_JSON",
        "ANALYSIS_SNAPSHOT_JSON"
    };

    private readonly AntifraudDbContext _dbContext;
    private readonly ILogger<AntifraudInfrastructureStatusService> _logger;

    public AntifraudInfrastructureStatusService(
        AntifraudDbContext dbContext,
        ILogger<AntifraudInfrastructureStatusService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<AntifraudInfrastructureDiagnosticsDto> GetDiagnosticsAsync(
        CancellationToken cancellationToken = default)
    {
        var requiredColumnsSql = string.Join(
            "," + Environment.NewLine,
            RequiredMonitoredCasesColumns.Select(
                (column, index) =>
                    $"""
                                    CASE WHEN EXISTS (
                                        SELECT 1
                                        FROM sys.columns
                                        WHERE object_id = OBJECT_ID('dbo.AF_MONITORED_CASES')
                                          AND name = '{column}'
                                    ) THEN 1 ELSE 0 END AS RequiredColumn{index + 1}Exists
                    """.Trim()));

        var sql = $"""
            SELECT
                CASE WHEN OBJECT_ID('dbo.AF_MONITORED_CASES', 'U') IS NOT NULL THEN 1 ELSE 0 END AS MonitoredCasesTableExists,
                CASE WHEN OBJECT_ID('dbo.AF_INCREMENTAL_CONTROL', 'U') IS NOT NULL THEN 1 ELSE 0 END AS IncrementalControlTableExists,
                CASE WHEN OBJECT_ID('dbo.AF_CASE_DECISION_HISTORY', 'U') IS NOT NULL THEN 1 ELSE 0 END AS DecisionHistoryTableExists,
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE object_id = OBJECT_ID('dbo.SINIESTROS')
                      AND name = 'IX_SINIESTROS_SIN_FECAUD_SIN_ID'
                ) THEN 1 ELSE 0 END AS SourceIndexExists,
            {requiredColumnsSql}
            ;
            """;

        try
        {
            var configuredConnectionString = _dbContext.Database.GetConnectionString();
            if (string.IsNullOrWhiteSpace(configuredConnectionString))
            {
                _logger.LogWarning("La cadena de conexion DefaultConnection no esta configurada para AntifraudDbContext.");
                return BuildUnavailableDiagnostics(
                    "La cadena de conexion DefaultConnection no esta configurada. Revise appsettings o variables de entorno.");
            }

            await using var connection = new SqlConnection(configuredConnectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            if (!await reader.ReadAsync(cancellationToken))
            {
                return BuildUnavailableDiagnostics("No se pudo leer el estado de infraestructura antifraude.");
            }

            var monitoredCases = reader.GetInt32(0) == 1;
            var incrementalControl = reader.GetInt32(1) == 1;
            var decisionHistory = reader.GetInt32(2) == 1;
            var sourceIndex = reader.GetInt32(3) == 1;
            var monitoredCasesColumnsReady = true;

            var missing = new List<string>();
            if (!monitoredCases) missing.Add("AF_MONITORED_CASES");
            if (!incrementalControl) missing.Add("AF_INCREMENTAL_CONTROL");
            if (!decisionHistory) missing.Add("AF_CASE_DECISION_HISTORY");
            if (!sourceIndex) missing.Add("IX_SINIESTROS_SIN_FECAUD_SIN_ID");

            for (var index = 0; index < RequiredMonitoredCasesColumns.Length; index++)
            {
                var columnExists = !reader.IsDBNull(4 + index) && reader.GetInt32(4 + index) == 1;
                if (columnExists)
                {
                    continue;
                }

                monitoredCasesColumnsReady = false;
                missing.Add($"AF_MONITORED_CASES.{RequiredMonitoredCasesColumns[index]}");
            }

            var persistenceEnabled = monitoredCases && monitoredCasesColumnsReady && incrementalControl && decisionHistory;
            var status = persistenceEnabled ? "ready" : "pending_infrastructure";
            var message = persistenceEnabled
                ? "La infraestructura antifraude minima existe."
                : "Falta infraestructura antifraude propia o el esquema esta desactualizado. El monitoreo incremental queda en modo degradado.";

            return new AntifraudInfrastructureDiagnosticsDto(
                monitoredCases,
                incrementalControl,
                decisionHistory,
                sourceIndex,
                persistenceEnabled,
                status,
                message,
                missing);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo consultar el estado de infraestructura antifraude.");
            return BuildUnavailableDiagnostics("No se pudo verificar la infraestructura antifraude sobre SQL Server.");
        }
    }

    public async Task EnsurePersistenceReadyAsync(CancellationToken cancellationToken = default)
    {
        var diagnostics = await GetDiagnosticsAsync(cancellationToken);
        if (diagnostics.PersistenceEnabled)
        {
            return;
        }

        throw new AntifraudInfrastructureMissingException(diagnostics.Message, diagnostics);
    }

    private static AntifraudInfrastructureDiagnosticsDto BuildUnavailableDiagnostics(string message)
    {
        return new AntifraudInfrastructureDiagnosticsDto(
            MonitoredCasesTableExists: false,
            IncrementalControlTableExists: false,
            DecisionHistoryTableExists: false,
            SourceIndexExists: false,
            PersistenceEnabled: false,
            Status: "pending_infrastructure",
            Message: message,
            MissingObjects: new[]
            {
                "AF_MONITORED_CASES",
                "AF_INCREMENTAL_CONTROL",
                "AF_CASE_DECISION_HISTORY",
                "IX_SINIESTROS_SIN_FECAUD_SIN_ID"
            });
    }
}
