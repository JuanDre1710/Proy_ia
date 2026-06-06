using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence;

public static class ServiceCollectionExtensions
{
    private const string DefaultConnectionName = "DefaultConnection";

    public static IServiceCollection AddDevelopmentSqlServerPersistence(
        this IServiceCollection services,
        IConfiguration cfg)
    {
        var connectionString = ResolveConnectionString(cfg);

        services.AddDbContext<DevelopmentClaimsDbContext>(options =>
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
