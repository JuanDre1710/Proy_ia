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
    public DbSet<ClientIdentityLookupRow> ClientIdentityLookup => Set<ClientIdentityLookupRow>();
    public DbSet<ClaimSelectionLookupRow> ClaimSelectionLookup => Set<ClaimSelectionLookupRow>();
    public DbSet<ClaimCaseLookupRow> ClaimCaseLookup => Set<ClaimCaseLookupRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DevelopmentClaimsDbContext).Assembly);
        modelBuilder.Entity<ClientIdentityLookupRow>().HasNoKey().ToView(null);
        modelBuilder.Entity<ClaimSelectionLookupRow>().HasNoKey().ToView(null);
        modelBuilder.Entity<ClaimCaseLookupRow>().HasNoKey().ToView(null);
    }
}
