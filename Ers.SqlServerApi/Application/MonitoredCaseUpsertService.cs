using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ers.SqlServerApi.Infrastructure.Persistence;
using Ers.SqlServerApi.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Application;

public sealed record MonitoredCaseUpsertResult(MonitoredCaseEntity Entity, bool WasInserted);

public sealed class MonitoredCaseUpsertService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly AntifraudDbContext _dbContext;
    private readonly AntifraudInfrastructureStatusService _infrastructureStatusService;

    public MonitoredCaseUpsertService(
        AntifraudDbContext dbContext,
        AntifraudInfrastructureStatusService infrastructureStatusService)
    {
        _dbContext = dbContext;
        _infrastructureStatusService = infrastructureStatusService;
    }

    public async Task<MonitoredCaseUpsertResult> UpsertAsync(
        CaseModel caseModel,
        CaseModelDto caseSnapshot,
        OperationalRiskAnalysisResponseDto analysis,
        DateTime sourceAuditDate,
        DateTime? sourceLoadDate,
        CancellationToken cancellationToken = default)
    {
        await _infrastructureStatusService.EnsurePersistenceReadyAsync(cancellationToken);

        var sinId = long.Parse(caseModel.SelectedClaim.ClaimId);
        var existing = await _dbContext.MonitoredCases
            .FirstOrDefaultAsync(item => item.SinId == sinId, cancellationToken);

        var now = DateTime.UtcNow;
        var wasInserted = existing is null;
        var entity = existing ?? new MonitoredCaseEntity
        {
            CaseId = Guid.NewGuid(),
            SinId = sinId,
            FechaCreacion = now,
            EstadoCaso = "pendiente"
        };

        var alertJson = JsonSerializer.Serialize(analysis.Alerts, JsonOptions);
        var caseSnapshotJson = JsonSerializer.Serialize(caseSnapshot, JsonOptions);
        var analysisSnapshotJson = JsonSerializer.Serialize(analysis, JsonOptions);
        var dataHash = ComputeHash(caseModel, analysis);
        var (nivelRiesgo, prioridad, prioridadOrden) = ResolvePriority(analysis);

        entity.CliId = long.TryParse(caseModel.Person.PersonId, out var cliId) ? cliId : null;
        entity.ClientDisplayName = caseModel.Person.DisplayName;
        entity.PzaNroSol = caseModel.Traceability.ProposalNumber;
        entity.PviId = caseModel.Traceability.PolicyValidityId;
        entity.PsiId = caseModel.Traceability.PolicyClaimLinkId;
        entity.NroSiniestro = caseModel.SelectedClaim.ClaimNumber;
        entity.NroPoliza = caseModel.Policy.PolicyNumber;
        entity.NroCertificado = caseModel.Policy.CertificateNumber;
        entity.FechaSiniestro = caseModel.SelectedClaim.ClaimDate;
        entity.MontoReclamo = caseModel.SelectedClaim.ClaimedAmount;
        entity.MontoPagado = caseModel.SelectedClaim.ClaimAmount;
        entity.Score = analysis.Score;
        entity.NivelRiesgo = nivelRiesgo;
        entity.Prioridad = prioridad;
        entity.PrioridadOrden = prioridadOrden;
        entity.ResumenPreview = analysis.SummaryForAnalyst;
        entity.Alertas = alertJson;
        entity.FechaUltimaEvaluacion = now;
        entity.HashDatos = dataHash;
        entity.SourceAuditDate = DateTime.SpecifyKind(sourceAuditDate, DateTimeKind.Utc);
        entity.SourceLoadDate = sourceLoadDate.HasValue ? DateTime.SpecifyKind(sourceLoadDate.Value, DateTimeKind.Utc) : null;
        entity.RecommendedAction = analysis.RecommendedAction;
        entity.CaseSnapshotJson = caseSnapshotJson;
        entity.AnalysisSnapshotJson = analysisSnapshotJson;

        if (existing is null)
        {
            _dbContext.MonitoredCases.Add(entity);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return new MonitoredCaseUpsertResult(entity, wasInserted);
    }

    private static string ComputeHash(CaseModel caseModel, OperationalRiskAnalysisResponseDto analysis)
    {
        var raw = string.Join("|",
            caseModel.SelectedClaim.ClaimId,
            caseModel.SelectedClaim.ClaimDate?.ToString("O"),
            caseModel.SelectedClaim.ClaimedAmount?.ToString(System.Globalization.CultureInfo.InvariantCulture),
            caseModel.SelectedClaim.ClaimAmount?.ToString(System.Globalization.CultureInfo.InvariantCulture),
            caseModel.Policy.PolicyNumber,
            caseModel.Policy.CertificateNumber,
            caseModel.Traceability.ProposalNumber,
            analysis.Score.ToString(System.Globalization.CultureInfo.InvariantCulture),
            analysis.RiskClass,
            string.Join(";", analysis.Alerts.Select(item => item.Code)));

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }

    private static (string NivelRiesgo, string Prioridad, int PrioridadOrden) ResolvePriority(
        OperationalRiskAnalysisResponseDto analysis)
    {
        if (!analysis.IsEvaluable)
        {
            return ("no_evaluable", "alta", 250);
        }

        if (analysis.Score >= 70 || string.Equals(analysis.RiskClass, "Sospechoso", StringComparison.OrdinalIgnoreCase))
        {
            return ("critico", "critica", 400);
        }

        if (analysis.Score >= 35)
        {
            return ("medio", "alta", 300);
        }

        if (analysis.Score >= 20)
        {
            return ("leve", "media", 200);
        }

        return ("normal", "baja", 100);
    }
}
