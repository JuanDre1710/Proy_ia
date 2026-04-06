using Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Configurations;

public sealed class PolizaConfiguration : IEntityTypeConfiguration<PolizaEntity>
{
    public void Configure(EntityTypeBuilder<PolizaEntity> builder)
    {
        builder.ToTable("POLIZAS");
        builder.HasKey(entity => entity.PzaNroSol);

        builder.Property(entity => entity.PzaNroSol).HasColumnName("PZA_NROSOL");
        builder.Property(entity => entity.CliIdTitular).HasColumnName("CLI_IDTITULAR");
        builder.Property(entity => entity.PzaFecAlta).HasColumnName("PZA_FECALTA");
        builder.Property(entity => entity.PzaEstado).HasColumnName("PZA_ESTADO").HasMaxLength(40);

        builder.HasOne(entity => entity.Titular)
            .WithMany(entity => entity.PolizasTitular)
            .HasForeignKey(entity => entity.CliIdTitular)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
