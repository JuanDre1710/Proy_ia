using Ers.SqlServerApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Application;

public sealed class AntifraudInfrastructureService
{
    private readonly IWebHostEnvironment _environment;
    private readonly AntifraudDbContext _dbContext;
    private readonly ILogger<AntifraudInfrastructureService> _logger;

    public AntifraudInfrastructureService(
        IWebHostEnvironment environment,
        AntifraudDbContext dbContext,
        ILogger<AntifraudInfrastructureService> logger)
    {
        _environment = environment;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task EnsureInfrastructureAsync(CancellationToken cancellationToken = default)
    {
        foreach (var scriptPath in GetScriptPaths())
        {
            var sql = await File.ReadAllTextAsync(scriptPath, cancellationToken);
            await _dbContext.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            _logger.LogInformation("Script SQL ejecutado: {ScriptPath}", scriptPath);
        }
    }

    public IReadOnlyList<string> GetScriptPaths()
    {
        var sqlRoot = Path.Combine(_environment.ContentRootPath, "sql", "antifraud");

        return new[]
        {
            Path.Combine(sqlRoot, "001_create_af_monitored_cases.sql"),
            Path.Combine(sqlRoot, "002_create_af_incremental_control.sql"),
            Path.Combine(sqlRoot, "003_create_af_case_decision_history.sql"),
            Path.Combine(sqlRoot, "004_seed_af_incremental_control.sql"),
            Path.Combine(sqlRoot, "005_create_ix_af_monitored_cases_priority_date.sql"),
            Path.Combine(sqlRoot, "006_create_ix_siniestros_sin_fecaud_sin_id.sql")
        };
    }
}
