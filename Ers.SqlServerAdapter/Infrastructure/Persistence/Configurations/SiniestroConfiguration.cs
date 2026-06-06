using Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Configurations;

public sealed class SiniestroConfiguration : IEntityTypeConfiguration<SiniestroEntity>
{
    public void Configure(EntityTypeBuilder<SiniestroEntity> builder)
    {
        builder.ToTable("SINIESTROS");
        builder.HasKey(entity => entity.SinId);

        builder.Property(entity => entity.SinId).HasColumnName("SIN_ID");
        builder.Property(entity => entity.PsiId).HasColumnName("PSI_ID");
        builder.Property(entity => entity.SinNumero).HasColumnName("SIN_NUMERO").HasMaxLength(60);
        builder.Property(entity => entity.SinFechaHora).HasColumnName("SIN_FECHAHORA");
        builder.Property(entity => entity.SinImporte).HasColumnName("SIN_IMPORTE").HasColumnType("decimal(18,2)");
        builder.Property(entity => entity.SinImpReclamo).HasColumnName("SIN_IMP_RECLAMO").HasColumnType("decimal(18,2)");
        builder.Property(entity => entity.VdoIdEstadoSin).HasColumnName("VDO_IDESTADO_SIN").HasMaxLength(40);
        builder.Property(entity => entity.TsiId).HasColumnName("TSI_ID").HasMaxLength(40);

        builder.HasOne(entity => entity.PolizaSiniestro)
            .WithMany(entity => entity.Siniestros)
            .HasForeignKey(entity => entity.PsiId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
