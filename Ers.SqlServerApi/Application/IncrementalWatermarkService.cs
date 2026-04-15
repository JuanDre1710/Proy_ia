using Ers.SqlServerApi.Infrastructure.Persistence;
using Ers.SqlServerApi.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Application;

public sealed class IncrementalWatermarkService
{
    private static readonly DateTime DefaultStartDate = new(2012, 2, 3, 17, 22, 11, 893, DateTimeKind.Utc);

    private readonly AntifraudDbContext _dbContext;
    private readonly AntifraudInfrastructureStatusService _infrastructureStatusService;

    public IncrementalWatermarkService(
        AntifraudDbContext dbContext,
        AntifraudInfrastructureStatusService infrastructureStatusService)
    {
        _dbContext = dbContext;
        _infrastructureStatusService = infrastructureStatusService;
    }

    public async Task<IncrementalProcessStateEntity> GetOrCreateAsync(
        string processName,
        CancellationToken cancellationToken = default)
    {
        var diagnostics = await _infrastructureStatusService.GetDiagnosticsAsync(cancellationToken);
        if (!diagnostics.PersistenceEnabled)
        {
            return BuildTransientState(processName, diagnostics.Status);
        }

        var entity = await _dbContext.IncrementalProcessStates
            .FirstOrDefaultAsync(item => item.ProcessName == processName, cancellationToken);

        if (entity is not null)
        {
            return entity;
        }

        entity = new IncrementalProcessStateEntity
        {
            ProcessName = processName,
            UltimaFechaProcesada = DateTime.SpecifyKind(DefaultStartDate, DateTimeKind.Utc),
            UltimoIdProcesado = 0,
            Estado = "pending"
        };

        _dbContext.IncrementalProcessStates.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task MarkRunningAsync(string processName, CancellationToken cancellationToken = default)
    {
        var diagnostics = await _infrastructureStatusService.GetDiagnosticsAsync(cancellationToken);
        if (!diagnostics.PersistenceEnabled)
        {
            return;
        }

        var entity = await GetOrCreateAsync(processName, cancellationToken);
        entity.Estado = "running";
        entity.UltimaEjecucion = DateTime.UtcNow;
        entity.MensajeError = null;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkCompletedAsync(
        string processName,
        DateTime watermarkDate,
        long watermarkClaimId,
        CancellationToken cancellationToken = default)
    {
        var diagnostics = await _infrastructureStatusService.GetDiagnosticsAsync(cancellationToken);
        if (!diagnostics.PersistenceEnabled)
        {
            return;
        }

        var entity = await GetOrCreateAsync(processName, cancellationToken);
        entity.UltimaFechaProcesada = DateTime.SpecifyKind(watermarkDate, DateTimeKind.Utc);
        entity.UltimoIdProcesado = watermarkClaimId;
        entity.Estado = "completed";
        entity.UltimaEjecucion = DateTime.UtcNow;
        entity.MensajeError = null;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkFailedAsync(
        string processName,
        string error,
        CancellationToken cancellationToken = default)
    {
        var diagnostics = await _infrastructureStatusService.GetDiagnosticsAsync(cancellationToken);
        if (!diagnostics.PersistenceEnabled)
        {
            return;
        }

        var entity = await GetOrCreateAsync(processName, cancellationToken);
        entity.Estado = "failed";
        entity.UltimaEjecucion = DateTime.UtcNow;
        entity.MensajeError = error;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IncrementalWatermarkDto> GetStatusAsync(
        string processName,
        CancellationToken cancellationToken = default)
    {
        var diagnostics = await _infrastructureStatusService.GetDiagnosticsAsync(cancellationToken);
        if (!diagnostics.PersistenceEnabled)
        {
            var transient = BuildTransientState(processName, diagnostics.Status);
            return new IncrementalWatermarkDto(
                transient.ProcessName,
                transient.UltimaFechaProcesada,
                transient.UltimoIdProcesado,
                transient.UltimaEjecucion,
                diagnostics.Status,
                diagnostics.Message,
                false);
        }

        var entity = await GetOrCreateAsync(processName, cancellationToken);
        return new IncrementalWatermarkDto(
            entity.ProcessName,
            entity.UltimaFechaProcesada,
            entity.UltimoIdProcesado,
            entity.UltimaEjecucion,
            entity.Estado,
            entity.MensajeError,
            true);
    }

    private static IncrementalProcessStateEntity BuildTransientState(string processName, string status)
    {
        return new IncrementalProcessStateEntity
        {
            ProcessName = processName,
            UltimaFechaProcesada = DefaultStartDate,
            UltimoIdProcesado = 0,
            UltimaEjecucion = null,
            Estado = status
        };
    }
}
