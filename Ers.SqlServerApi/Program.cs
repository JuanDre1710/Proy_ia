using Ers.SqlServerAdapter.Contracts;
using Ers.SqlServerAdapter.Infrastructure.DataAccess.Providers;
using Ers.SqlServerAdapter.Infrastructure.Persistence;
using Ers.SqlServerApi.Application;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<SqlServerIdentityClaimProvider>();
builder.Services.AddScoped<IPersonSearchProvider>(sp => sp.GetRequiredService<SqlServerIdentityClaimProvider>());
builder.Services.AddScoped<IClaimQueryProvider>(sp => sp.GetRequiredService<SqlServerIdentityClaimProvider>());
builder.Services.AddScoped<ICaseDataProvider>(sp => sp.GetRequiredService<SqlServerIdentityClaimProvider>());
builder.Services.AddScoped<IdentitySearchService>();
builder.Services.AddScoped<CaseAssemblyService>();
builder.Services.AddScoped<OperationalRiskAnalysisService>();
builder.Services.AddScoped<CaseDashboardService>();

var app = builder.Build();

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

app.Run();
