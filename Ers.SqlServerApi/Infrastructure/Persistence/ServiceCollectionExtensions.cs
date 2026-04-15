using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Infrastructure.Persistence;

public static class ServiceCollectionExtensions
{
    private const string DefaultConnectionName = "DefaultConnection";

    public static IServiceCollection AddAntifraudPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = ResolveConnectionString(configuration);

        services.AddDbContext<AntifraudDbContext>(options =>
            options.UseSqlServer(connectionString));

        return services;
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        return (configuration.GetConnectionString(DefaultConnectionName)
                ?? configuration[$"ConnectionStrings:{DefaultConnectionName}"]
                ?? string.Empty)
            .Trim();
    }
}
