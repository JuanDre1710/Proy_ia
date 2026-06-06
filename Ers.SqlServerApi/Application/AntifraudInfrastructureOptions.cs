namespace Ers.SqlServerApi.Application;

public sealed class AntifraudInfrastructureOptions
{
    public bool AutoApplyOnStartup { get; init; }

    public bool FailStartupIfApplyFails { get; init; }
}
