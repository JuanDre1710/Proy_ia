using Ers.SqlServerApi.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Infrastructure.Persistence;

public sealed class AntifraudDbContext : DbContext
{
    public AntifraudDbContext(DbContextOptions<AntifraudDbContext> options) : base(options)
    {
    }

    public DbSet<MonitoredCaseEntity> MonitoredCases => Set<MonitoredCaseEntity>();
    public DbSet<IncrementalProcessStateEntity> IncrementalProcessStates => Set<IncrementalProcessStateEntity>();
    public DbSet<CaseDecisionHistoryEntity> CaseDecisionHistory => Set<CaseDecisionHistoryEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var monitoredCase = modelBuilder.Entity<MonitoredCaseEntity>();
        monitoredCase.ToTable("AF_MONITORED_CASES");
        monitoredCase.HasKey(item => item.CaseId);
        monitoredCase.HasIndex(item => item.SinId).IsUnique();
        monitoredCase.HasIndex(item => new { item.PrioridadOrden, item.FechaUltimaEvaluacion });
        monitoredCase.Property(item => item.CaseId).HasColumnName("CASE_ID");
        monitoredCase.Property(item => item.SinId).HasColumnName("SIN_ID");
        monitoredCase.Property(item => item.CliId).HasColumnName("CLI_ID");
        monitoredCase.Property(item => item.ClientDisplayName).HasColumnName("CLIENT_DISPLAY_NAME");
        monitoredCase.Property(item => item.PzaNroSol).HasColumnName("PZA_NROSOL");
        monitoredCase.Property(item => item.PviId).HasColumnName("PVI_ID");
        monitoredCase.Property(item => item.PsiId).HasColumnName("PSI_ID");
        monitoredCase.Property(item => item.NroSiniestro).HasColumnName("NRO_SINIESTRO");
        monitoredCase.Property(item => item.NroPoliza).HasColumnName("NRO_POLIZA");
        monitoredCase.Property(item => item.NroCertificado).HasColumnName("NRO_CERTIFICADO");
        monitoredCase.Property(item => item.FechaSiniestro).HasColumnName("FECHA_SINIESTRO");
        monitoredCase.Property(item => item.MontoReclamo).HasColumnName("MONTO_RECLAMO");
        monitoredCase.Property(item => item.MontoPagado).HasColumnName("MONTO_PAGADO");
        monitoredCase.Property(item => item.Score).HasColumnName("SCORE");
        monitoredCase.Property(item => item.NivelRiesgo).HasColumnName("NIVEL_RIESGO");
        monitoredCase.Property(item => item.Prioridad).HasColumnName("PRIORIDAD");
        monitoredCase.Property(item => item.PrioridadOrden).HasColumnName("PRIORIDAD_ORDEN");
        monitoredCase.Property(item => item.EstadoCaso).HasColumnName("ESTADO_CASO");
        monitoredCase.Property(item => item.Decision).HasColumnName("DECISION");
        monitoredCase.Property(item => item.FraudeConfirmado).HasColumnName("FRAUDE_CONFIRMADO");
        monitoredCase.Property(item => item.UsuarioDecision).HasColumnName("USUARIO_DECISION");
        monitoredCase.Property(item => item.FechaDecision).HasColumnName("FECHA_DECISION");
        monitoredCase.Property(item => item.Comentario).HasColumnName("COMENTARIO");
        monitoredCase.Property(item => item.ResumenPreview).HasColumnName("RESUMEN_PREVIEW");
        monitoredCase.Property(item => item.Alertas).HasColumnName("ALERTAS");
        monitoredCase.Property(item => item.FechaCreacion).HasColumnName("FECHA_CREACION");
        monitoredCase.Property(item => item.FechaUltimaEvaluacion).HasColumnName("FECHA_ULTIMA_EVALUACION");
        monitoredCase.Property(item => item.HashDatos).HasColumnName("HASH_DATOS");
        monitoredCase.Property(item => item.SourceAuditDate).HasColumnName("SOURCE_AUDIT_DATE");
        monitoredCase.Property(item => item.SourceLoadDate).HasColumnName("SOURCE_LOAD_DATE");
        monitoredCase.Property(item => item.RecommendedAction).HasColumnName("RECOMMENDED_ACTION");
        monitoredCase.Property(item => item.CaseSnapshotJson).HasColumnName("CASE_SNAPSHOT_JSON");
        monitoredCase.Property(item => item.AnalysisSnapshotJson).HasColumnName("ANALYSIS_SNAPSHOT_JSON");
        monitoredCase.Property(item => item.NivelRiesgo).HasMaxLength(30);
        monitoredCase.Property(item => item.Prioridad).HasMaxLength(30);
        monitoredCase.Property(item => item.EstadoCaso).HasMaxLength(30);
        monitoredCase.Property(item => item.Decision).HasMaxLength(30);
        monitoredCase.Property(item => item.UsuarioDecision).HasMaxLength(120);
        monitoredCase.Property(item => item.HashDatos).HasMaxLength(128);
        monitoredCase.Property(item => item.ClientDisplayName).HasMaxLength(200);
        monitoredCase.Property(item => item.PzaNroSol).HasMaxLength(50);
        monitoredCase.Property(item => item.PviId).HasMaxLength(50);
        monitoredCase.Property(item => item.PsiId).HasMaxLength(50);
        monitoredCase.Property(item => item.NroSiniestro).HasMaxLength(80);
        monitoredCase.Property(item => item.NroPoliza).HasMaxLength(80);
        monitoredCase.Property(item => item.NroCertificado).HasMaxLength(80);
        monitoredCase.Property(item => item.RecommendedAction).HasMaxLength(200);

        var processState = modelBuilder.Entity<IncrementalProcessStateEntity>();
        processState.ToTable("AF_INCREMENTAL_CONTROL");
        processState.HasKey(item => item.ProcessName);
        processState.Property(item => item.ProcessName).HasColumnName("PROCESS_NAME");
        processState.Property(item => item.UltimaFechaProcesada).HasColumnName("ULTIMA_FECHA_PROCESADA");
        processState.Property(item => item.UltimoIdProcesado).HasColumnName("ULTIMO_ID_PROCESADO");
        processState.Property(item => item.UltimaEjecucion).HasColumnName("ULTIMA_EJECUCION");
        processState.Property(item => item.Estado).HasColumnName("ESTADO");
        processState.Property(item => item.MensajeError).HasColumnName("MENSAJE_ERROR");
        processState.Property(item => item.ProcessName).HasMaxLength(100);
        processState.Property(item => item.Estado).HasMaxLength(30);

        var decisionHistory = modelBuilder.Entity<CaseDecisionHistoryEntity>();
        decisionHistory.ToTable("AF_CASE_DECISION_HISTORY");
        decisionHistory.HasKey(item => item.HistoryId);
        decisionHistory.HasIndex(item => new { item.SinId, item.FechaAccion });
        decisionHistory.Property(item => item.HistoryId).HasColumnName("HISTORY_ID");
        decisionHistory.Property(item => item.CaseId).HasColumnName("CASE_ID");
        decisionHistory.Property(item => item.SinId).HasColumnName("SIN_ID");
        decisionHistory.Property(item => item.ActionType).HasColumnName("ACTION_TYPE");
        decisionHistory.Property(item => item.Decision).HasColumnName("DECISION");
        decisionHistory.Property(item => item.FraudeConfirmado).HasColumnName("FRAUDE_CONFIRMADO");
        decisionHistory.Property(item => item.Usuario).HasColumnName("USUARIO");
        decisionHistory.Property(item => item.Comentario).HasColumnName("COMENTARIO");
        decisionHistory.Property(item => item.FechaAccion).HasColumnName("FECHA_ACCION");
        decisionHistory.Property(item => item.ActionType).HasMaxLength(40);
        decisionHistory.Property(item => item.Decision).HasMaxLength(30);
        decisionHistory.Property(item => item.Usuario).HasMaxLength(120);
        decisionHistory.HasOne(item => item.Case)
            .WithMany(item => item.DecisionHistory)
            .HasForeignKey(item => item.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
