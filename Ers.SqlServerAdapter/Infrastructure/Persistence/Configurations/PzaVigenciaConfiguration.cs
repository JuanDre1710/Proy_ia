using Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Configurations;

public sealed class PzaVigenciaConfiguration : IEntityTypeConfiguration<PzaVigenciaEntity>
{
    public void Configure(EntityTypeBuilder<PzaVigenciaEntity> builder)
    {
        builder.ToTable("PZA_VIGENCIAS");
        builder.HasKey(entity => new { entity.PzaNroSol, entity.PviNroPol, entity.PviNroCer });

        builder.Property(entity => entity.PzaNroSol).HasColumnName("PZA_NROSOL");
        builder.Property(entity => entity.PviNroPol).HasColumnName("PVI_NROPOL").HasMaxLength(50);
        builder.Property(entity => entity.PviNroCer).HasColumnName("PVI_NROCER").HasMaxLength(50);
        builder.Property(entity => entity.PviPremio).HasColumnName("PVI_PREMIO").HasColumnType("decimal(18,2)");

        builder.HasOne(entity => entity.Poliza)
            .WithMany(entity => entity.Vigencias)
            .HasForeignKey(entity => entity.PzaNroSol)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
