using Ers.SqlServerAdapter.Contracts;

namespace Ers.SqlServerApi.Application;

public sealed class IncrementalMonitoringService
{
    private readonly IIncrementalClaimProvider _incrementalClaimProvider;
    private readonly CaseAssemblyService _caseAssemblyService;
    private readonly OperationalRiskAnalysisService _riskAnalysisService;
    private readonly MonitoredCaseUpsertService _upsertService;
    private readonly IncrementalWatermarkService _watermarkService;
    private readonly AntifraudInfrastructureStatusService _infrastructureStatusService;
    private readonly ILogger<IncrementalMonitoringService> _logger;

    public IncrementalMonitoringService(
        IIncrementalClaimProvider incrementalClaimProvider,
        CaseAssemblyService caseAssemblyService,
        OperationalRiskAnalysisService riskAnalysisService,
        MonitoredCaseUpsertService upsertService,
        IncrementalWatermarkService watermarkService,
        AntifraudInfrastructureStatusService infrastructureStatusService,
        ILogger<IncrementalMonitoringService> logger)
    {
        _incrementalClaimProvider = incrementalClaimProvider;
        _caseAssemblyService = caseAssemblyService;
        _riskAnalysisService = riskAnalysisService;
        _upsertService = upsertService;
        _watermarkService = watermarkService;
        _infrastructureStatusService = infrastructureStatusService;
        _logger = logger;
    }

    public async Task<MonitoringRunResponseDto> RunAsync(
        MonitoringRunRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request.BatchSize <= 0 || request.BatchSize > 1000)
        {
            throw new InvalidOperationException("BatchSize debe estar entre 1 y 1000.");
        }

        if (request.LookbackDays < 0 || request.LookbackDays > 30)
        {
            throw new InvalidOperationException("LookbackDays debe estar entre 0 y 30.");
        }

        var diagnostics = await _infrastructureStatusService.GetDiagnosticsAsync(cancellationToken);
        var state = await _watermarkService.GetOrCreateAsync(request.Process, cancellationToken);

        if (diagnostics.PersistenceEnabled)
        {
            await _watermarkService.MarkRunningAsync(request.Process, cancellationToken);
        }

        var persistedWatermarkDate = state.UltimaFechaProcesada;
        var persistedWatermarkId = state.UltimoIdProcesado;
        var readFromDate = persistedWatermarkDate.AddDays(-request.LookbackDays);
        var scanDate = readFromDate;
        long scanId = 0;
        var effectiveMaxBatches = diagnostics.PersistenceEnabled ? request.MaxBatches : Math.Min(request.MaxBatches, 1);
        var processed = 0;
        string? lastClaimId = null;
        DateTime? lastAuditDate = null;

        try
        {
            for (var batchNumber = 0; batchNumber < effectiveMaxBatches; batchNumber++)
            {
                var batch = await _incrementalClaimProvider.ListIncrementalClaimsAsync(
                    scanDate,
                    scanId,
                    readFromDate,
                    request.BatchSize,
                    cancellationToken);

                if (batch.Count == 0)
                {
                    break;
                }

                foreach (var item in batch)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    var domainModel = await _caseAssemblyService.BuildDomainModelAsync(
                        new BuildCaseFromClaimRequestDto(item.ClaimId),
                        cancellationToken);

                    if (domainModel is null)
                    {
                        throw new InvalidOperationException($"No se pudo reconstruir el caso para SIN_ID {item.ClaimId}.");
                    }

                    var caseSnapshot = await _caseAssemblyService.BuildFromClaimAsync(
                        new BuildCaseFromClaimRequestDto(item.ClaimId),
                        cancellationToken);

                    if (caseSnapshot is null)
                    {
                        throw new InvalidOperationException($"No se pudo generar snapshot DTO para SIN_ID {item.ClaimId}.");
                    }

                    var analysis = _riskAnalysisService.Analyze(domainModel);

                    if (diagnostics.PersistenceEnabled)
                    {
                        await _upsertService.UpsertAsync(
                            domainModel,
                            caseSnapshot,
                            analysis,
                            item.AuditDate,
                            item.LoadDate,
                            cancellationToken);
                    }

                    processed++;
                    lastClaimId = item.ClaimId;
                    lastAuditDate = item.AuditDate;
                    scanDate = item.AuditDate;
                    scanId = long.Parse(item.ClaimId);
                }

                if (batch.Count < request.BatchSize)
                {
                    break;
                }
            }

            if (diagnostics.PersistenceEnabled)
            {
                await _watermarkService.MarkCompletedAsync(
                    request.Process,
                    processed == 0 ? persistedWatermarkDate : lastAuditDate ?? persistedWatermarkDate,
                    processed == 0 ? persistedWatermarkId : long.Parse(lastClaimId!),
                    cancellationToken);
            }

            return new MonitoringRunResponseDto(
                request.Process,
                diagnostics.PersistenceEnabled ? "completed" : "pending_infrastructure",
                processed,
                lastClaimId,
                lastAuditDate,
                diagnostics.PersistenceEnabled
                    ? processed == 0
                        ? "No se detectaron siniestros nuevos o modificados dentro de la ventana incremental."
                        : "Corrida incremental completada."
                    : processed == 0
                        ? "Infraestructura antifraude pendiente. Se valido la lectura incremental sin persistencia."
                        : "Infraestructura antifraude pendiente. Se valido parcialmente la lectura, armado y analisis sin persistir resultados.",
                diagnostics.PersistenceEnabled,
                !diagnostics.PersistenceEnabled);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallo la corrida incremental del proceso {Process}.", request.Process);

            if (diagnostics.PersistenceEnabled)
            {
                await _watermarkService.MarkFailedAsync(request.Process, ex.Message, cancellationToken);
            }

            return new MonitoringRunResponseDto(
                request.Process,
                "failed",
                processed,
                lastClaimId,
                lastAuditDate,
                ex.Message,
                diagnostics.PersistenceEnabled,
                !diagnostics.PersistenceEnabled);
        }
    }
}
