namespace Ers.SqlServerApi.Application;

public sealed class AntifraudInfrastructureMissingException : InvalidOperationException
{
    public AntifraudInfrastructureMissingException(
        string message,
        AntifraudInfrastructureDiagnosticsDto diagnostics) : base(message)
    {
        Diagnostics = diagnostics;
    }

    public AntifraudInfrastructureDiagnosticsDto Diagnostics { get; }
}
