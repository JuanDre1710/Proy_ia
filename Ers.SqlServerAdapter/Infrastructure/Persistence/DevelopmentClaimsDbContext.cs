using Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;
using Ers.SqlServerAdapter.Infrastructure.Persistence.Queries;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence;

public sealed class DevelopmentClaimsDbContext : DbContext
{
    public DevelopmentClaimsDbContext(DbContextOptions<DevelopmentClaimsDbContext> options) : base(options)
    {
    }

    public DbSet<ExtClienteEntity> ExtClientes => Set<ExtClienteEntity>();
    public DbSet<PolizaEntity> Polizas => Set<PolizaEntity>();
    public DbSet<PzaVigenciaEntity> PzaVigencias => Set<PzaVigenciaEntity>();
    public DbSet<PolizaSiniestroEntity> PolizasSiniestros => Set<PolizaSiniestroEntity>();
    public DbSet<SiniestroEntity> Siniestros => Set<SiniestroEntity>();
    public DbSet<OfficialClaimSearchRow> OfficialClaimSearch => Set<OfficialClaimSearchRow>();
    public DbSet<PersonWithoutClaimsLookupRow> PersonWithoutClaimsLookup => Set<PersonWithoutClaimsLookupRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DevelopmentClaimsDbContext).Assembly);
        modelBuilder.Entity<OfficialClaimSearchRow>().HasNoKey().ToView(null);
        modelBuilder.Entity<PersonWithoutClaimsLookupRow>().HasNoKey().ToView(null);
    }
}
