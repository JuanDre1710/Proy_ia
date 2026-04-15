using Ers.SqlServerAdapter.Contracts;
using Ers.SqlServerAdapter.Infrastructure.DataAccess.Providers;
using Ers.SqlServerAdapter.Infrastructure.Persistence;
using Ers.SqlServerApi.Application;
using Ers.SqlServerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);
var startupConnectionString =
    (builder.Configuration.GetConnectionString("DefaultConnection")
     ?? builder.Configuration["ConnectionStrings:DefaultConnection"]
     ?? string.Empty).Trim();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddDevelopmentSqlServerPersistence(builder.Configuration);
builder.Services.AddAntifraudPersistence(builder.Configuration);
builder.Services.AddScoped<SqlServerIdentityClaimProvider>();
builder.Services.AddScoped<IPersonSearchProvider>(sp => sp.GetRequiredService<SqlServerIdentityClaimProvider>());
builder.Services.AddScoped<IClaimQueryProvider>(sp => sp.GetRequiredService<SqlServerIdentityClaimProvider>());
builder.Services.AddScoped<ICaseDataProvider>(sp => sp.GetRequiredService<SqlServerIdentityClaimProvider>());
builder.Services.AddScoped<IIncrementalClaimProvider>(sp => sp.GetRequiredService<SqlServerIdentityClaimProvider>());
builder.Services.AddScoped<IdentitySearchService>();
builder.Services.AddScoped<CaseAssemblyService>();
builder.Services.AddScoped<OperationalRiskAnalysisService>();
builder.Services.AddScoped<CaseDashboardService>();
builder.Services.AddScoped<AntifraudInfrastructureService>();
builder.Services.AddScoped<AntifraudInfrastructureStatusService>();
builder.Services.AddScoped<IncrementalWatermarkService>();
builder.Services.AddScoped<MonitoredCaseUpsertService>();
builder.Services.AddScoped<IncrementalMonitoringService>();
builder.Services.AddScoped<OperationalCasesService>();
builder.Services.AddScoped<CaseInboxService>();
builder.Services.AddScoped<CommercialAnalyticsService>();

var app = builder.Build();

app.Logger.LogInformation(
    "DefaultConnection configurada al arrancar API: {IsConfigured}. Longitud: {Length}.",
    !string.IsNullOrWhiteSpace(startupConnectionString),
    startupConnectionString.Length);

app.UseCors("FrontendDev");
app.UseSwagger();
app.UseSwaggerUI();

app.MapPost(
        "/identity/search",
        async (
            [FromBody] IdentitySearchRequestDto request,
            IdentitySearchService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Document))
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_document",
                        message = "Document is required."
                    }
                });
            }

            var response = await service.SearchAsync(request, cancellationToken);
            return Results.Ok(response);
        })
    .WithName("IdentitySearch")
    .WithTags("identity-search")
    .WithOpenApi();

app.MapPost(
        "/cases/from-claim",
        async (
            [FromBody] BuildCaseFromClaimRequestDto request,
            CaseAssemblyService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.ClaimId))
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_claim_id",
                        message = "ClaimId is required."
                    }
                });
            }

            var response = await service.BuildFromClaimAsync(request, cancellationToken);
            if (response is null)
            {
                return Results.NotFound(new
                {
                    error = new
                    {
                        code = "claim_not_found",
                        message = "No se encontro el siniestro seleccionado."
                    }
                });
            }

            return Results.Ok(response);
        })
    .WithName("BuildCaseFromClaim")
    .WithTags("cases")
    .WithOpenApi();

app.MapPost(
        "/cases/analyze",
        async (
            [FromBody] AnalyzeCaseRequestDto request,
            OperationalRiskAnalysisService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.ClaimId))
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_claim_id",
                        message = "ClaimId is required."
                    }
                });
            }

            var response = await service.AnalyzeAsync(request, cancellationToken);
            if (response is null)
            {
                return Results.NotFound(new
                {
                    error = new
                    {
                        code = "claim_not_found",
                        message = "No se encontro el siniestro seleccionado."
                    }
                });
            }

            return Results.Ok(response);
        })
    .WithName("AnalyzeCase")
    .WithTags("analysis")
    .WithOpenApi();

app.MapGet(
        "/commercial/dashboard",
        async (
            HttpContext httpContext,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var response = await service.GetDashboardAsync(query, cancellationToken);
            return Results.Ok(response);
        })
    .WithName("GetCommercialDashboard")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/summary",
        async (
            HttpContext httpContext,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var response = await service.GetSummaryAsync(query, cancellationToken);
            return Results.Ok(response);
        })
    .WithName("GetCommercialSummary")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/top-products",
        async (
            HttpContext httpContext,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var response = await service.GetTopProductsAsync(query, cancellationToken);
            return Results.Ok(response);
        })
    .WithName("GetCommercialTopProducts")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/products/{productId:int}/detail",
        async (
            HttpContext httpContext,
            int productId,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var response = await service.GetProductDetailAsync(productId, query, cancellationToken);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
    .WithName("GetCommercialProductDetail")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/clients/without-policies",
        async (
            HttpContext httpContext,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var response = await service.GetClientsWithoutPoliciesAsync(query, cancellationToken);
            return Results.Ok(response);
        })
    .WithName("GetCommercialClientsWithoutPolicies")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/clients/{clientId:long}/detail",
        async (
            HttpContext httpContext,
            long clientId,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var response = await service.GetClientDetailAsync(clientId, cancellationToken);
            return response is null ? Results.NotFound() : Results.Ok(response);
        })
    .WithName("GetCommercialClientDetail")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/clients/quoted-not-bought",
        async (
            HttpContext httpContext,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var response = await service.GetQuotedNotBoughtAsync(query, cancellationToken);
            return Results.Ok(response);
        })
    .WithName("GetCommercialQuotedNotBought")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/exports/summary.csv",
        async (
            HttpContext httpContext,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var export = await service.ExportSummaryCsvAsync(query, cancellationToken);
            return Results.File(export.Content, "text/csv; charset=utf-8", export.FileName);
        })
    .WithName("ExportCommercialSummaryCsv")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/exports/clients-without-policies.csv",
        async (
            HttpContext httpContext,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var export = await service.ExportClientsWithoutPoliciesCsvAsync(query, cancellationToken);
            return Results.File(export.Content, "text/csv; charset=utf-8", export.FileName);
        })
    .WithName("ExportCommercialClientsWithoutPoliciesCsv")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/commercial/exports/quoted-not-bought.csv",
        async (
            HttpContext httpContext,
            [AsParameters] CommercialAnalyticsQueryDto query,
            CommercialAnalyticsService service,
            CancellationToken cancellationToken) =>
        {
            if (!HasCommercialAccess(httpContext))
            {
                return CommercialAccessForbidden();
            }

            var export = await service.ExportQuotedNotBoughtCsvAsync(query, cancellationToken);
            return Results.File(export.Content, "text/csv; charset=utf-8", export.FileName);
        })
    .WithName("ExportCommercialQuotedNotBoughtCsv")
    .WithTags("commercial")
    .WithOpenApi();

app.MapGet(
        "/cases",
        async (
            [FromQuery] int? take,
            CaseInboxService service,
            CancellationToken cancellationToken) =>
        {
            var response = await service.ListPendingAsync(Math.Clamp(take ?? 100, 1, 500), cancellationToken);
            return Results.Ok(response);
        })
    .WithName("ListCases")
    .WithTags("cases")
    .WithOpenApi();

app.MapGet(
        "/cases/{caseId}",
        async (
            string caseId,
            CaseDashboardService service,
            CancellationToken cancellationToken) =>
        {
            var response = await service.GetCaseAsync(caseId, cancellationToken);
            if (response is null)
            {
                return Results.NotFound(new
                {
                    error = new
                    {
                        code = "case_not_found",
                        message = "No se encontro el caso solicitado."
                    }
                });
            }

            return Results.Ok(response);
        })
    .WithName("GetCaseDetail")
    .WithTags("cases")
    .WithOpenApi();

app.MapGet(
        "/cases/{caseId}/graph",
        async (
            string caseId,
            CaseDashboardService service,
            CancellationToken cancellationToken) =>
        {
            var response = await service.GetGraphAsync(caseId, cancellationToken);
            return Results.Ok(response);
        })
    .WithName("GetCaseGraph")
    .WithTags("cases")
    .WithOpenApi();

app.MapPost(
        "/monitoring/run",
        async (
            [FromBody] MonitoringRunRequestDto request,
            IncrementalMonitoringService service,
            CancellationToken cancellationToken) =>
        {
            var response = await service.RunAsync(request, cancellationToken);
            return response.Status == "failed"
                ? Results.Problem(response.Message)
                : Results.Ok(response);
        })
    .WithName("RunIncrementalMonitoring")
    .WithTags("monitoring")
    .WithOpenApi();

app.MapGet(
        "/monitoring/diagnostics",
        async (
            AntifraudInfrastructureStatusService service,
            CancellationToken cancellationToken) =>
        {
            var response = await service.GetDiagnosticsAsync(cancellationToken);
            return Results.Ok(response);
        })
    .WithName("GetMonitoringDiagnostics")
    .WithTags("monitoring")
    .WithOpenApi();

app.MapGet(
        "/monitoring/status/{process}",
        async (
            string process,
            IncrementalWatermarkService service,
            CancellationToken cancellationToken) =>
        {
            var response = await service.GetStatusAsync(process, cancellationToken);
            return Results.Ok(response);
        })
    .WithName("GetMonitoringStatus")
    .WithTags("monitoring")
    .WithOpenApi();

app.MapGet(
        "/monitoring/cases",
        async (
            [FromQuery] int? take,
            OperationalCasesService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var response = await service.ListAsync(Math.Clamp(take ?? 100, 1, 500), cancellationToken);
                return Results.Ok(response);
            }
            catch (AntifraudInfrastructureMissingException ex)
            {
                return PendingInfrastructure(ex);
            }
        })
    .WithName("ListMonitoredCases")
    .WithTags("monitoring")
    .WithOpenApi();

app.MapGet(
        "/monitoring/cases/{sinId:long}",
        async (
            long sinId,
            OperationalCasesService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var response = await service.GetBySinIdAsync(sinId, cancellationToken);
                if (response is null)
                {
                    return Results.NotFound(new
                    {
                        error = new
                        {
                            code = "monitored_case_not_found",
                            message = "No se encontro el caso monitoreado solicitado."
                        }
                    });
                }

                return Results.Ok(response);
            }
            catch (AntifraudInfrastructureMissingException ex)
            {
                return PendingInfrastructure(ex);
            }
        })
    .WithName("GetMonitoredCase")
    .WithTags("monitoring")
    .WithOpenApi();

app.MapPost(
        "/cases/{sinId:long}/decision",
        async (
            long sinId,
            [FromBody] CaseDecisionRequestDto request,
            OperationalCasesService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Decision) || string.IsNullOrWhiteSpace(request.Usuario))
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_decision_request",
                        message = "Decision y usuario son requeridos."
                    }
                });
            }

            try
            {
                var response = await service.RegisterDecisionAsync(sinId, request, cancellationToken);
                return response is null ? Results.NotFound() : Results.Ok(response);
            }
            catch (AntifraudInfrastructureMissingException ex)
            {
                return PendingInfrastructure(ex);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_decision",
                        message = ex.Message
                    }
                });
            }
        })
    .WithName("RegisterCaseDecisionAlias")
    .WithTags("cases")
    .WithOpenApi();

app.MapPost(
        "/cases/{sinId:long}/resolution",
        async (
            long sinId,
            [FromBody] CaseResolutionRequestDto request,
            OperationalCasesService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Usuario))
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_resolution_request",
                        message = "Usuario es requerido."
                    }
                });
            }

            try
            {
                var response = await service.RegisterResolutionAsync(sinId, request, cancellationToken);
                return response is null ? Results.NotFound() : Results.Ok(response);
            }
            catch (AntifraudInfrastructureMissingException ex)
            {
                return PendingInfrastructure(ex);
            }
        })
    .WithName("RegisterCaseResolutionAlias")
    .WithTags("cases")
    .WithOpenApi();

app.MapPost(
        "/monitoring/cases/{sinId:long}/decision",
        async (
            long sinId,
            [FromBody] CaseDecisionRequestDto request,
            OperationalCasesService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Decision) || string.IsNullOrWhiteSpace(request.Usuario))
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_decision_request",
                        message = "Decision y usuario son requeridos."
                    }
                });
            }

            try
            {
                var response = await service.RegisterDecisionAsync(sinId, request, cancellationToken);
                return response is null ? Results.NotFound() : Results.Ok(response);
            }
            catch (AntifraudInfrastructureMissingException ex)
            {
                return PendingInfrastructure(ex);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_decision",
                        message = ex.Message
                    }
                });
            }
        })
    .WithName("RegisterCaseDecision")
    .WithTags("monitoring")
    .WithOpenApi();

app.MapPost(
        "/monitoring/cases/{sinId:long}/resolution",
        async (
            long sinId,
            [FromBody] CaseResolutionRequestDto request,
            OperationalCasesService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Usuario))
            {
                return Results.BadRequest(new
                {
                    error = new
                    {
                        code = "invalid_resolution_request",
                        message = "Usuario es requerido."
                    }
                });
            }

            try
            {
                var response = await service.RegisterResolutionAsync(sinId, request, cancellationToken);
                return response is null ? Results.NotFound() : Results.Ok(response);
            }
            catch (AntifraudInfrastructureMissingException ex)
            {
                return PendingInfrastructure(ex);
            }
        })
    .WithName("RegisterCaseResolution")
    .WithTags("monitoring")
    .WithOpenApi();

app.Run();

static IResult PendingInfrastructure(AntifraudInfrastructureMissingException ex)
{
    return Results.Json(
        new
        {
            status = "pending_infrastructure",
            message = ex.Message,
            diagnostics = ex.Diagnostics
        },
        statusCode: StatusCodes.Status503ServiceUnavailable);
}

static bool HasCommercialAccess(HttpContext httpContext)
{
    var role = httpContext.Request.Headers["X-Actor-Role"].ToString().Trim();
    return string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
        || string.Equals(role, "Supervisor", StringComparison.OrdinalIgnoreCase);
}

static IResult CommercialAccessForbidden()
{
    return Results.Json(
        new
        {
            error = new
            {
                code = "commercial_access_forbidden",
                message = "La pantalla comercial solo esta habilitada para Administrador y Supervisor."
            }
        },
        statusCode: StatusCodes.Status403Forbidden);
}
