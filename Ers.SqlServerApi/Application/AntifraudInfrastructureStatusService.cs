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

    private static readonly string[] RequiredIncrementalControlColumns =
    {
        "PROCESS_NAME",
        "ULTIMA_FECHA_PROCESADA",
        "ULTIMO_ID_PROCESADO",
        "ULTIMA_EJECUCION",
        "ESTADO",
        "MENSAJE_ERROR"
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
        var requiredControlColumnsSql = string.Join(
            "," + Environment.NewLine,
            RequiredIncrementalControlColumns.Select(
                (column, index) =>
                    $"""
                                    CASE WHEN EXISTS (
                                        SELECT 1
                                        FROM sys.columns
                                        WHERE object_id = OBJECT_ID('dbo.AF_INCREMENTAL_CONTROL')
                                          AND name = '{column}'
                                    ) THEN 1 ELSE 0 END AS RequiredControlColumn{index + 1}Exists
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
            {requiredColumnsSql},
            {requiredControlColumnsSql}
            ;
            """;

        try
        {
            var configuredConnectionString = _dbContext.Database.GetConnectionString();
            if (string.IsNullOrWhiteSpace(configuredConnectionString))
            {
                _logger.LogWarning("La cadena de conexion DefaultConnection no esta configurada para AntifraudDbContext.");
                return BuildUnavailableDiagnostics(
                    "connection_not_configured",
                    "La cadena de conexion DefaultConnection no esta configurada. Revise appsettings o variables de entorno.",
                    new[] { "ConnectionStrings:DefaultConnection" },
                    failureCode: "missing_connection_string");
            }

            await using var connection = new SqlConnection(configuredConnectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            if (!await reader.ReadAsync(cancellationToken))
            {
                return BuildUnavailableDiagnostics(
                    "sql_unreachable",
                    "No se pudo leer el estado de infraestructura antifraude.",
                    Array.Empty<string>(),
                    failureCode: "empty_result");
            }

            var monitoredCases = reader.GetInt32(0) == 1;
            var incrementalControl = reader.GetInt32(1) == 1;
            var decisionHistory = reader.GetInt32(2) == 1;
            var sourceIndex = reader.GetInt32(3) == 1;
            var monitoredCasesColumnsReady = true;
            var incrementalControlColumnsReady = true;

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

            var controlColumnOffset = 4 + RequiredMonitoredCasesColumns.Length;
            for (var index = 0; index < RequiredIncrementalControlColumns.Length; index++)
            {
                var columnExists = !reader.IsDBNull(controlColumnOffset + index)
                                   && reader.GetInt32(controlColumnOffset + index) == 1;
                if (columnExists)
                {
                    continue;
                }

                incrementalControlColumnsReady = false;
                missing.Add($"AF_INCREMENTAL_CONTROL.{RequiredIncrementalControlColumns[index]}");
            }

            var persistenceEnabled = monitoredCases
                                     && monitoredCasesColumnsReady
                                     && incrementalControl
                                     && incrementalControlColumnsReady
                                     && decisionHistory;
            var status = persistenceEnabled
                ? sourceIndex ? "ready" : "ready_with_warnings"
                : "pending_infrastructure";
            var message = persistenceEnabled
                ? sourceIndex
                    ? "La infraestructura antifraude minima existe."
                    : "La infraestructura antifraude minima existe. Falta el indice recomendado sobre SINIESTROS para optimizar el monitoreo incremental."
                : "Falta infraestructura antifraude propia o el esquema esta desactualizado. El monitoreo incremental queda en modo degradado.";

            return new AntifraudInfrastructureDiagnosticsDto(
                monitoredCases,
                incrementalControl,
                decisionHistory,
                sourceIndex,
                persistenceEnabled,
                status,
                message,
                missing,
                ConnectionAvailable: true,
                FailureCode: null);
        }
        catch (SqlException ex)
        {
            _logger.LogWarning(ex, "No se pudo conectar a SQL Server para consultar infraestructura antifraude.");
            return BuildUnavailableDiagnostics(
                "sql_unreachable",
                "No se pudo conectar a SQL Server para verificar la infraestructura antifraude.",
                Array.Empty<string>(),
                failureCode: $"sql_{ex.Number}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo consultar el estado de infraestructura antifraude.");
            return BuildUnavailableDiagnostics(
                "sql_unreachable",
                "No se pudo verificar la infraestructura antifraude sobre SQL Server.",
                Array.Empty<string>(),
                failureCode: ex.GetType().Name);
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

    private static AntifraudInfrastructureDiagnosticsDto BuildUnavailableDiagnostics(
        string status,
        string message,
        IReadOnlyList<string>? missingObjects = null,
        string? failureCode = null)
    {
        return new AntifraudInfrastructureDiagnosticsDto(
            MonitoredCasesTableExists: false,
            IncrementalControlTableExists: false,
            DecisionHistoryTableExists: false,
            SourceIndexExists: false,
            PersistenceEnabled: false,
            Status: status,
            Message: message,
            MissingObjects: missingObjects ?? Array.Empty<string>(),
            ConnectionAvailable: false,
            FailureCode: failureCode);
    }
}
