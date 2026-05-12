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
        if (!diagnostics.ConnectionAvailable)
        {
            _logger.LogWarning(
                "Corrida incremental {Process} omitida. SQL no disponible. Status: {Status}. Mensaje: {Message}.",
                request.Process,
                diagnostics.Status,
                diagnostics.Message);

            return new MonitoringRunResponseDto(
                request.Process,
                diagnostics.Status,
                0,
                0,
                0,
                null,
                null,
                diagnostics.Message,
                false,
                true);
        }

        var state = await _watermarkService.GetOrCreateAsync(request.Process, cancellationToken);

        if (diagnostics.PersistenceEnabled)
        {
            await _watermarkService.MarkRunningAsync(request.Process, cancellationToken);
        }

        var persistedWatermarkDate = state.UltimaFechaProcesada;
        var persistedWatermarkId = state.UltimoIdProcesado;
        var readFromDate = persistedWatermarkDate.AddDays(-request.LookbackDays);
        var scanDate = readFromDate;
        var scanId = readFromDate == persistedWatermarkDate ? persistedWatermarkId : 0;
        var effectiveMaxBatches = diagnostics.PersistenceEnabled ? request.MaxBatches : Math.Min(request.MaxBatches, 1);
        var processed = 0;
        var inserted = 0;
        var updated = 0;
        string? lastClaimId = null;
        DateTime? lastAuditDate = null;

        _logger.LogInformation(
            "Corrida incremental iniciada. Process: {Process}. Watermark inicial: {WatermarkDate:o}/{WatermarkId}. ReadFrom: {ReadFromDate:o}. BatchSize: {BatchSize}. MaxBatches: {MaxBatches}. Persistencia: {PersistenceEnabled}.",
            request.Process,
            persistedWatermarkDate,
            persistedWatermarkId,
            readFromDate,
            request.BatchSize,
            effectiveMaxBatches,
            diagnostics.PersistenceEnabled);

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

                    try
                    {
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
                            var upsert = await _upsertService.UpsertAsync(
                                domainModel,
                                caseSnapshot,
                                analysis,
                                item.AuditDate,
                                item.LoadDate,
                                cancellationToken);

                            if (upsert.WasInserted)
                            {
                                inserted++;
                            }
                            else
                            {
                                updated++;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(
                            ex,
                            "Error parcial en corrida incremental. Process: {Process}. SIN_ID: {ClaimId}. SIN_FECAUD: {AuditDate:o}. Batch: {BatchNumber}. Procesados previos: {ProcessedCount}.",
                            request.Process,
                            item.ClaimId,
                            item.AuditDate,
                            batchNumber + 1,
                            processed);
                        throw;
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
                var (completedWatermarkDate, completedWatermarkId) = ResolveCompletedWatermark(
                    persistedWatermarkDate,
                    persistedWatermarkId,
                    lastAuditDate,
                    lastClaimId);

                await _watermarkService.MarkCompletedAsync(
                    request.Process,
                    completedWatermarkDate,
                    completedWatermarkId,
                    cancellationToken);
            }

            var finalWatermarkDate = persistedWatermarkDate;
            var finalWatermarkId = persistedWatermarkId;
            if (diagnostics.PersistenceEnabled)
            {
                (finalWatermarkDate, finalWatermarkId) = ResolveCompletedWatermark(
                    persistedWatermarkDate,
                    persistedWatermarkId,
                    lastAuditDate,
                    lastClaimId);
            }

            _logger.LogInformation(
                "Corrida incremental terminada. Process: {Process}. Status: {Status}. Procesados: {ProcessedCount}. Insertados: {InsertedCount}. Actualizados: {UpdatedCount}. Watermark final: {WatermarkDate:o}/{WatermarkId}.",
                request.Process,
                diagnostics.PersistenceEnabled ? "completed" : "pending_infrastructure",
                processed,
                inserted,
                updated,
                finalWatermarkDate,
                finalWatermarkId);

            return new MonitoringRunResponseDto(
                request.Process,
                diagnostics.PersistenceEnabled ? "completed" : "pending_infrastructure",
                processed,
                inserted,
                updated,
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
                inserted,
                updated,
                lastClaimId,
                lastAuditDate,
                ex.Message,
                diagnostics.PersistenceEnabled,
                !diagnostics.PersistenceEnabled);
        }
    }

    private static (DateTime WatermarkDate, long WatermarkClaimId) ResolveCompletedWatermark(
        DateTime persistedWatermarkDate,
        long persistedWatermarkId,
        DateTime? lastAuditDate,
        string? lastClaimId)
    {
        if (!lastAuditDate.HasValue || string.IsNullOrWhiteSpace(lastClaimId))
        {
            return (persistedWatermarkDate, persistedWatermarkId);
        }

        var parsedLastClaimId = long.Parse(lastClaimId);
        return IsAfterPersistedWatermark(
            lastAuditDate.Value,
            parsedLastClaimId,
            persistedWatermarkDate,
            persistedWatermarkId)
            ? (lastAuditDate.Value, parsedLastClaimId)
            : (persistedWatermarkDate, persistedWatermarkId);
    }

    private static bool IsAfterPersistedWatermark(
        DateTime candidateDate,
        long candidateClaimId,
        DateTime persistedWatermarkDate,
        long persistedWatermarkId)
    {
        if (candidateDate > persistedWatermarkDate)
        {
            return true;
        }

        return candidateDate == persistedWatermarkDate && candidateClaimId > persistedWatermarkId;
    }
}
