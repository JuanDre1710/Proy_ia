using Ers.SqlServerAdapter.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Configurations;

public sealed class ExtClienteConfiguration : IEntityTypeConfiguration<ExtClienteEntity>
{
    public void Configure(EntityTypeBuilder<ExtClienteEntity> builder)
    {
        builder.ToTable("EXT_CLIENTES");
        builder.HasKey(entity => entity.CliId);

        builder.Property(entity => entity.CliId).HasColumnName("CLI_ID");
        builder.Property(entity => entity.CliIdente).HasColumnName("CLI_IDENTE").HasMaxLength(100);
        builder.Property(entity => entity.VdoTipoDoc).HasColumnName("VDO_TIPODOC");
        builder.Property(entity => entity.CliNroDoc).HasColumnName("CLI_NRODOC");
        builder.Property(entity => entity.CliCuitl).HasColumnName("CLI_CUITL");
        builder.Property(entity => entity.CliApellido).HasColumnName("CLI_APELLIDO").HasMaxLength(120);
        builder.Property(entity => entity.CliNombre).HasColumnName("CLI_NOMBRE").HasMaxLength(120);
        builder.Property(entity => entity.CliRazonSocial).HasColumnName("CLI_RAZONSOCIAL").HasMaxLength(160);
        builder.Property(entity => entity.CliEmail).HasColumnName("CLI_EMAIL").HasMaxLength(160);
    }
}
