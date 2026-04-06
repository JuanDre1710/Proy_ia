using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDevelopmentSqlServerPersistence(
        this IServiceCollection services,
        IConfiguration cfg)
    {
        services.AddDbContext<DevelopmentClaimsDbContext>(options =>
            options.UseSqlServer(cfg.GetConnectionString("DefaultConnection")));

        return services;
    }
}
