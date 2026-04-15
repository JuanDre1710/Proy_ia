using System.Text.Json;
using Ers.SqlServerAdapter.Contracts;
using Ers.SqlServerApi.Infrastructure.Persistence;
using Ers.SqlServerApi.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Application;

public sealed class OperationalCasesService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private const string PlaceholderSummary = "Caso pendiente de analisis automatico. Se registro decision operativa manual.";

    private readonly AntifraudDbContext _dbContext;
    private readonly AntifraudInfrastructureStatusService _infrastructureStatusService;
    private readonly ICaseDataProvider _caseDataProvider;
    private readonly CaseAssemblyService _caseAssemblyService;
    private readonly OperationalRiskAnalysisService _riskAnalysisService;

    public OperationalCasesService(
        AntifraudDbContext dbContext,
        AntifraudInfrastructureStatusService infrastructureStatusService,
        ICaseDataProvider caseDataProvider,
        CaseAssemblyService caseAssemblyService,
        OperationalRiskAnalysisService riskAnalysisService)
    {
        _dbContext = dbContext;
        _infrastructureStatusService = infrastructureStatusService;
        _caseDataProvider = caseDataProvider;
        _caseAssemblyService = caseAssemblyService;
        _riskAnalysisService = riskAnalysisService;
    }

    public async Task<IReadOnlyList<MonitoredCaseListItemDto>> ListAsync(
        int take,
        CancellationToken cancellationToken = default)
    {
        await EnsurePersistenceReadyAsync(cancellationToken);

        var items = await _dbContext.MonitoredCases
            .AsNoTracking()
            .OrderByDescending(item => item.PrioridadOrden)
            .ThenByDescending(item => item.FechaUltimaEvaluacion)
            .Take(take)
            .ToListAsync(cancellationToken);

        return items.Select(MapListItem).ToList();
    }

    public async Task<MonitoredCaseDetailDto?> GetBySinIdAsync(
        long sinId,
        CancellationToken cancellationToken = default)
    {
        await EnsurePersistenceReadyAsync(cancellationToken);

        var entity = await _dbContext.MonitoredCases
            .AsNoTracking()
            .Include(item => item.DecisionHistory.OrderByDescending(history => history.FechaAccion))
            .FirstOrDefaultAsync(item => item.SinId == sinId, cancellationToken);

        return entity is null ? null : MapDetail(entity);
    }

    public async Task<MonitoredCaseDetailDto?> RegisterDecisionAsync(
        long sinId,
        CaseDecisionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await EnsurePersistenceReadyAsync(cancellationToken);

        var entity = await _dbContext.MonitoredCases
            .Include(item => item.DecisionHistory)
            .FirstOrDefaultAsync(item => item.SinId == sinId, cancellationToken);

        if (entity is null)
        {
            entity = await CreatePendingCaseAsync(sinId, cancellationToken);
            if (entity is null)
            {
                return null;
            }
        }

        entity.Decision = NormalizeDecision(request.Decision);
        entity.EstadoCaso = entity.Decision == "revisar" ? "en_revision" : "cerrado";
        entity.UsuarioDecision = request.Usuario.Trim();
        entity.FechaDecision = DateTime.UtcNow;
        entity.Comentario = request.Comentario?.Trim();

        entity.DecisionHistory.Add(new CaseDecisionHistoryEntity
        {
            CaseId = entity.CaseId,
            SinId = entity.SinId,
            ActionType = "decision",
            Decision = entity.Decision,
            FraudeConfirmado = entity.FraudeConfirmado,
            Usuario = entity.UsuarioDecision,
            Comentario = entity.Comentario,
            FechaAccion = entity.FechaDecision.Value
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetBySinIdAsync(sinId, cancellationToken);
    }

    public async Task<MonitoredCaseDetailDto?> RegisterResolutionAsync(
        long sinId,
        CaseResolutionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await EnsurePersistenceReadyAsync(cancellationToken);

        var entity = await _dbContext.MonitoredCases
            .Include(item => item.DecisionHistory)
            .FirstOrDefaultAsync(item => item.SinId == sinId, cancellationToken);

        if (entity is null)
        {
            entity = await CreatePendingCaseAsync(sinId, cancellationToken);
            if (entity is null)
            {
                return null;
            }
        }

        entity.FraudeConfirmado = request.FraudeConfirmado;
        entity.UsuarioDecision = request.Usuario.Trim();
        entity.FechaDecision = DateTime.UtcNow;
        entity.Comentario = request.Comentario?.Trim();
        entity.EstadoCaso = "cerrado";

        entity.DecisionHistory.Add(new CaseDecisionHistoryEntity
        {
            CaseId = entity.CaseId,
            SinId = entity.SinId,
            ActionType = "resolution",
            Decision = entity.Decision,
            FraudeConfirmado = request.FraudeConfirmado,
            Usuario = entity.UsuarioDecision,
            Comentario = entity.Comentario,
            FechaAccion = entity.FechaDecision.Value
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetBySinIdAsync(sinId, cancellationToken);
    }

    private static MonitoredCaseListItemDto MapListItem(MonitoredCaseEntity entity)
    {
        var alerts = Deserialize<List<RiskAlertDto>>(entity.Alertas) ?? new List<RiskAlertDto>();
        var topAlerts = alerts.Count == 0
            ? null
            : string.Join("; ", alerts.Take(3).Select(item => item.Title));

        return new MonitoredCaseListItemDto(
            entity.CaseId.ToString(),
            entity.SinId,
            entity.NroSiniestro,
            entity.ClientDisplayName,
            entity.FechaSiniestro,
            entity.Score,
            entity.NivelRiesgo,
            entity.Prioridad,
            entity.EstadoCaso,
            entity.Decision,
            entity.FraudeConfirmado,
            topAlerts,
            entity.ResumenPreview,
            entity.FechaUltimaEvaluacion,
            true,
            false);
    }

    private static MonitoredCaseDetailDto MapDetail(MonitoredCaseEntity entity)
    {
        var alerts = Deserialize<List<RiskAlertDto>>(entity.Alertas) ?? new List<RiskAlertDto>();
        var caseSnapshot = Deserialize<CaseModelDto>(entity.CaseSnapshotJson);
        var analysisSnapshot = Deserialize<OperationalRiskAnalysisResponseDto>(entity.AnalysisSnapshotJson);

        return new MonitoredCaseDetailDto(
            entity.CaseId.ToString(),
            entity.SinId,
            entity.CliId,
            entity.ClientDisplayName,
            entity.PzaNroSol,
            entity.PviId,
            entity.PsiId,
            entity.NroSiniestro,
            entity.NroPoliza,
            entity.NroCertificado,
            entity.FechaSiniestro,
            entity.MontoReclamo,
            entity.MontoPagado,
            entity.Score,
            entity.NivelRiesgo,
            entity.Prioridad,
            entity.EstadoCaso,
            entity.Decision,
            entity.FraudeConfirmado,
            entity.UsuarioDecision,
            entity.FechaDecision,
            entity.Comentario,
            entity.ResumenPreview,
            alerts,
            entity.FechaCreacion,
            entity.FechaUltimaEvaluacion,
            entity.SourceAuditDate,
            entity.SourceLoadDate,
            entity.RecommendedAction,
            caseSnapshot,
            analysisSnapshot,
            entity.DecisionHistory
                .OrderByDescending(item => item.FechaAccion)
                .Select(item => new CaseDecisionHistoryDto(
                    item.HistoryId,
                    item.ActionType,
                    item.Decision,
                    item.FraudeConfirmado,
                    item.Usuario,
                    item.Comentario,
                    item.FechaAccion))
                .ToList());
    }

    private static T? Deserialize<T>(string json)
    {
        return string.IsNullOrWhiteSpace(json)
            ? default
            : JsonSerializer.Deserialize<T>(json, JsonOptions);
    }

    private static string NormalizeDecision(string decision)
    {
        var normalized = decision.Trim().ToLowerInvariant();
        return normalized switch
        {
            "aceptado" => "aceptado",
            "denegado" => "denegado",
            "revisar" => "revisar",
            _ => throw new InvalidOperationException("Decision invalida. Use aceptado, denegado o revisar.")
        };
    }

    private async Task<MonitoredCaseEntity?> CreatePendingCaseAsync(
        long sinId,
        CancellationToken cancellationToken)
    {
        var claim = await _caseDataProvider.GetClaimCaseDataAsync(sinId.ToString(), cancellationToken);
        if (claim is null)
        {
            return null;
        }

        var caseSnapshot = await _caseAssemblyService.BuildFromClaimAsync(
            new BuildCaseFromClaimRequestDto(sinId.ToString()),
            cancellationToken);
        var caseModel = await _caseAssemblyService.BuildDomainModelAsync(
            new BuildCaseFromClaimRequestDto(sinId.ToString()),
            cancellationToken);
        var analysis = caseModel is null ? null : _riskAnalysisService.Analyze(caseModel);
        var (nivelRiesgo, prioridad, prioridadOrden) = analysis is null
            ? ("sin_analizar", "media", 150)
            : ResolvePriority(analysis);
        var now = DateTime.UtcNow;
        var entity = new MonitoredCaseEntity
        {
            CaseId = Guid.NewGuid(),
            SinId = sinId,
            CliId = long.TryParse(claim.PersonId, out var cliId) ? cliId : null,
            ClientDisplayName = claim.PersonDisplayName,
            PzaNroSol = claim.ProposalNumber,
            PviId = claim.PolicyValidityId,
            PsiId = claim.PolicyClaimLinkId,
            NroSiniestro = claim.ClaimNumber,
            NroPoliza = claim.PolicyNumber,
            NroCertificado = claim.CertificateNumber,
            FechaSiniestro = claim.OccurredAt,
            MontoReclamo = claim.ClaimedAmount,
            MontoPagado = claim.ClaimAmount,
            Score = analysis?.Score ?? 0,
            NivelRiesgo = nivelRiesgo,
            Prioridad = prioridad,
            PrioridadOrden = prioridadOrden,
            EstadoCaso = "pendiente",
            ResumenPreview = analysis?.SummaryForAnalyst ?? PlaceholderSummary,
            Alertas = analysis is null ? "[]" : JsonSerializer.Serialize(analysis.Alerts, JsonOptions),
            FechaCreacion = now,
            FechaUltimaEvaluacion = now,
            HashDatos = $"MANUAL-{sinId}",
            SourceAuditDate = now,
            SourceLoadDate = now,
            RecommendedAction = analysis?.RecommendedAction ?? "Registrar decision operativa manual.",
            CaseSnapshotJson = caseSnapshot is null ? "{}" : JsonSerializer.Serialize(caseSnapshot, JsonOptions),
            AnalysisSnapshotJson = analysis is null ? "{}" : JsonSerializer.Serialize(analysis, JsonOptions)
        };

        _dbContext.MonitoredCases.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity;
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

    private async Task EnsurePersistenceReadyAsync(CancellationToken cancellationToken)
    {
        var configuredConnectionString = _dbContext.Database.GetConnectionString();
        var effectiveConnectionString = _dbContext.Database.GetDbConnection().ConnectionString;

        if (string.IsNullOrWhiteSpace(configuredConnectionString) || string.IsNullOrWhiteSpace(effectiveConnectionString))
        {
            throw new AntifraudInfrastructureMissingException(
                "La cadena de conexion DefaultConnection no esta configurada para el subsistema antifraude.",
                new AntifraudInfrastructureDiagnosticsDto(
                    MonitoredCasesTableExists: false,
                    IncrementalControlTableExists: false,
                    DecisionHistoryTableExists: false,
                    SourceIndexExists: false,
                    PersistenceEnabled: false,
                    Status: "pending_infrastructure",
                    Message: "La cadena de conexion DefaultConnection no esta configurada para el subsistema antifraude.",
                    MissingObjects: new[] { "ConnectionStrings:DefaultConnection" }));
        }

        var diagnostics = await _infrastructureStatusService.GetDiagnosticsAsync(cancellationToken);
        if (diagnostics.PersistenceEnabled)
        {
            return;
        }

        throw new AntifraudInfrastructureMissingException(
            "La bandeja operativa antifraude requiere tablas propias creadas.",
            diagnostics);
    }
}
