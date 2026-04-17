using Ers.SqlServerApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Application;

public sealed class AntifraudInfrastructureService
{
    private static readonly string[] ScriptFileNames =
    {
        "001_create_af_monitored_cases.sql",
        "002_create_af_incremental_control.sql",
        "003_create_af_case_decision_history.sql",
        "004_seed_af_incremental_control.sql",
        "005_create_ix_af_monitored_cases_priority_date.sql",
        "006_create_ix_siniestros_sin_fecaud_sin_id.sql"
    };

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
        var sqlRoot = ResolveSqlRoot();
        var scriptPaths = ScriptFileNames
            .Select(fileName => Path.Combine(sqlRoot, fileName))
            .ToArray();

        var missingScripts = scriptPaths
            .Where(path => !File.Exists(path))
            .ToArray();

        if (missingScripts.Length > 0)
        {
            throw new FileNotFoundException(
                $"No se encontraron todos los scripts SQL antifraude. Faltan: {string.Join(", ", missingScripts)}");
        }

        return scriptPaths;
    }

    private string ResolveSqlRoot()
    {
        var current = new DirectoryInfo(_environment.ContentRootPath);

        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "sql", "antifraud");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException(
            $"No se encontro el directorio de scripts SQL antifraude a partir de {_environment.ContentRootPath}.");
    }
}
