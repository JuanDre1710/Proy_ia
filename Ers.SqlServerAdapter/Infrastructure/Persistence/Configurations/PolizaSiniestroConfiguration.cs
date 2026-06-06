using Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Configurations;

public sealed class PolizaSiniestroConfiguration : IEntityTypeConfiguration<PolizaSiniestroEntity>
{
    public void Configure(EntityTypeBuilder<PolizaSiniestroEntity> builder)
    {
        builder.ToTable("POLIZAS_SINIESTROS");
        builder.HasKey(entity => entity.PsiId);

        builder.Property(entity => entity.PsiId).HasColumnName("PSI_ID");
        builder.Property(entity => entity.PzaNroSol).HasColumnName("PZA_NROSOL");
        builder.Property(entity => entity.CliId).HasColumnName("CLI_ID");
        builder.Property(entity => entity.PsiEstado).HasColumnName("PSI_ESTADO").HasMaxLength(40);

        builder.HasOne(entity => entity.Poliza)
            .WithMany(entity => entity.PolizaSiniestros)
            .HasForeignKey(entity => entity.PzaNroSol)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(entity => entity.Cliente)
            .WithMany(entity => entity.PolizasSiniestros)
            .HasForeignKey(entity => entity.CliId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
