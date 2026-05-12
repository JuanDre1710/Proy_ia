using System.Data;
using Ers.SqlServerAdapter.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerApi.Application;

public sealed class CommercialAnalyticsService
{
    private const int HeavyCommercialQueryTimeoutSeconds = 20;
    private static readonly CommercialFilterSupportDto PolicyFilterSupport = new(
        Date: true,
        Branch: true,
        Channel: true,
        Product: true,
        Seller: true);

    private static readonly CommercialFilterSupportDto NoPolicyClientFilterSupport = new(
        Date: false,
        Branch: false,
        Channel: false,
        Product: false,
        Seller: false);

    private static readonly CommercialFilterSupportDto QuoteFilterSupport = new(
        Date: true,
        Branch: false,
        Channel: false,
        Product: false,
        Seller: false);

    private readonly DevelopmentClaimsDbContext _claimsDbContext;

    public CommercialAnalyticsService(DevelopmentClaimsDbContext claimsDbContext)
    {
        _claimsDbContext = claimsDbContext;
    }

    public async Task<CommercialSummaryResponseDto> GetSummaryAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var normalized = Normalize(query);
        CommercialTopProductDto? topProduct = null;
        int policyCount = 0;
        IReadOnlyList<CommercialStatusCountDto> policyStatusBreakdown = Array.Empty<CommercialStatusCountDto>();
        int clientsWithoutPoliciesCount = 0;
        int quotedNotBoughtCount = 0;
        var unsupportedFilters = BuildSummaryUnsupportedFilters().ToList();

        try
        {
            topProduct = await ReadTopProductHeadlineAsync(normalized, cancellationToken);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            unsupportedFilters.Add("mostCommercializedProduct is currently unavailable because the ranking query exceeded the database execution time");
        }

        try
        {
            policyCount = await ReadPolicyCountAsync(normalized, cancellationToken);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            unsupportedFilters.Add("policiesSoldCount is currently unavailable because the count query exceeded the database execution time");
        }

        try
        {
            policyStatusBreakdown = await ReadPolicyStatusBreakdownAsync(normalized, cancellationToken);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            unsupportedFilters.Add("policyStatusBreakdown is currently unavailable because the aggregation query exceeded the database execution time");
        }

        try
        {
            clientsWithoutPoliciesCount = await ReadClientsWithoutPoliciesCountAsync(cancellationToken);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            unsupportedFilters.Add("clientsWithoutPoliciesCount is currently unavailable because the count query exceeded the database execution time");
        }

        try
        {
            quotedNotBoughtCount = (await ReadQuotedNotBoughtCountsAsync(normalized, cancellationToken)).TotalCount;
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            unsupportedFilters.Add("quotedNotBoughtCount is currently unavailable because the count query exceeded the database execution time");
        }

        return new CommercialSummaryResponseDto(
            ToFilters(normalized),
            PolicyFilterSupport,
            unsupportedFilters,
            new CommercialSummaryDto(
                policyCount,
                topProduct,
                clientsWithoutPoliciesCount,
                quotedNotBoughtCount,
                policyStatusBreakdown,
                BuildCriteria()));
    }

    public async Task<CommercialTopProductsResponseDto> GetTopProductsAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var normalized = Normalize(query);
        try
        {
            var items = await ReadTopProductsCoreAsync(normalized, normalized.Take ?? 50, normalized.Offset ?? 0, cancellationToken);
            var unsupportedFilters = new List<string>();
            int totalCount;

            try
            {
                totalCount = await ReadTopProductsCountAsync(normalized, cancellationToken);
            }
            catch (SqlException ex) when (IsSqlTimeout(ex))
            {
                totalCount = EstimatePagedTotalCount(normalized, items.Count);
                unsupportedFilters.Add("topProducts totalCount is estimated because the count query exceeded the database execution time");
            }

            return new CommercialTopProductsResponseDto(
                ToFilters(normalized),
                PolicyFilterSupport,
                unsupportedFilters,
                totalCount,
                normalized.Offset ?? 0,
                normalized.Take ?? 50,
                items);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            return new CommercialTopProductsResponseDto(
                ToFilters(normalized),
                PolicyFilterSupport,
                new[]
                {
                    "topProducts is currently unavailable because the ranking query exceeded the database execution time"
                },
                0,
                normalized.Offset ?? 0,
                normalized.Take ?? 50,
                Array.Empty<CommercialTopProductDto>());
        }
    }

    public async Task<CommercialClientsWithoutPoliciesResponseDto> GetClientsWithoutPoliciesAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var normalized = Normalize(query);
        var unsupportedFilters = new List<string>
        {
            "date is not available for clients without policies",
            "branch is not available for clients without policies",
            "channel is not available for clients without policies",
            "product and plan are not available for clients without policies",
            "seller is not available for clients without policies"
        };

        try
        {
            var items = await ReadClientsWithoutPoliciesItemsAsync(normalized, cancellationToken);
            int totalCount;
            int withQuotesCount = 0;
            int withoutQuotesCount = 0;

            try
            {
                totalCount = await ReadClientsWithoutPoliciesCountAsync(cancellationToken);
                withQuotesCount = await ReadClientsWithoutPoliciesWithQuotesCountAsync(cancellationToken);
                withoutQuotesCount = Math.Max(0, totalCount - withQuotesCount);
            }
            catch (SqlException ex) when (IsSqlTimeout(ex))
            {
                totalCount = EstimatePagedTotalCount(normalized, items.Count);
                unsupportedFilters.Add("clientsWithoutPolicies totalCount is estimated because the count query exceeded the database execution time");
            }

            return new CommercialClientsWithoutPoliciesResponseDto(
                ToFilters(normalized),
                NoPolicyClientFilterSupport,
                unsupportedFilters,
                totalCount,
                withQuotesCount,
                withoutQuotesCount,
                normalized.Offset ?? 0,
                normalized.Take ?? 50,
                items);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            unsupportedFilters.Add("clientsWithoutPolicies is currently unavailable because the database query exceeded the execution time");

            return new CommercialClientsWithoutPoliciesResponseDto(
                ToFilters(normalized),
                NoPolicyClientFilterSupport,
                unsupportedFilters,
                0,
                0,
                0,
                normalized.Offset ?? 0,
                normalized.Take ?? 50,
                Array.Empty<CommercialClientWithoutPolicyDto>());
        }
    }

    public async Task<CommercialQuotedNotBoughtResponseDto> GetQuotedNotBoughtAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var normalized = Normalize(query);
        var unsupportedFilters = new List<string>
        {
            "branch is not available in COTIZACIONES",
            "channel is not available in COTIZACIONES",
            "product and plan are not available safely because COTIZACIONES uses TPR_ID instead of PRODUCTOS.PRO_ID and PLANES.PLA_ID",
            "seller is not available in COTIZACIONES"
        };

        try
        {
            var items = await ReadQuotedNotBoughtItemsAsync(normalized, cancellationToken);
            int totalCount;
            int boughtAfterQuoteCount = 0;
            int neverHadPolicyCount = 0;
            int unclassifiedCount = 0;

            try
            {
                var counts = await ReadQuotedNotBoughtCountsAsync(normalized, cancellationToken);
                totalCount = counts.TotalCount;
                boughtAfterQuoteCount = counts.BoughtAfterQuoteCount;
                neverHadPolicyCount = counts.NeverHadPolicyCount;
                unclassifiedCount = counts.UnclassifiedCount;
            }
            catch (SqlException ex) when (IsSqlTimeout(ex))
            {
                totalCount = EstimatePagedTotalCount(normalized, items.Count);
                unsupportedFilters.Add("quotedNotBought totalCount is estimated because the count query exceeded the database execution time");
            }

            return new CommercialQuotedNotBoughtResponseDto(
                ToFilters(normalized),
                QuoteFilterSupport,
                unsupportedFilters,
                totalCount,
                boughtAfterQuoteCount,
                neverHadPolicyCount,
                unclassifiedCount,
                normalized.Offset ?? 0,
                normalized.Take ?? 50,
                items);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            unsupportedFilters.Add("quotedNotBought is currently unavailable because the database query exceeded the execution time");

            return new CommercialQuotedNotBoughtResponseDto(
                ToFilters(normalized),
                QuoteFilterSupport,
                unsupportedFilters,
                0,
                0,
                0,
                0,
                normalized.Offset ?? 0,
                normalized.Take ?? 50,
                Array.Empty<CommercialQuotedNotBoughtDto>());
        }
    }

    public async Task<CommercialProductDetailResponseDto?> GetProductDetailAsync(
        int productId,
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var normalized = Normalize(new CommercialAnalyticsQueryDto
        {
            StartDate = query.StartDate,
            EndDate = query.EndDate,
            BranchId = query.BranchId,
            ChannelId = query.ChannelId,
            ProductId = productId,
            PlanId = query.PlanId,
            SellerId = query.SellerId,
            SortBy = query.SortBy,
            SortDirection = query.SortDirection,
            Take = query.Take,
            Offset = query.Offset
        });

        const string sql = """
            SELECT TOP 1
                pr.PRO_ID,
                pr.TPR_ID,
                CONVERT(nvarchar(200), pr.PRO_DESCRIPCION) AS PRODUCT_NAME,
                COUNT(*) AS POLICIES_SOLD,
                COUNT(DISTINCT p.CLI_IDTITULAR) AS UNIQUE_CLIENTS,
                SUM(COALESCE(p.PZA_PREMIOCALC, 0)) AS TOTAL_PREMIUM,
                MAX(p.PZA_FECALTA) AS LAST_POLICY_DATE
            FROM POLIZAS p
            INNER JOIN PLANES pl
                ON pl.PLA_ID = p.PLA_ID
            INNER JOIN PRODUCTOS pr
                ON pr.PRO_ID = pl.PRO_ID
            WHERE
                pr.PRO_ID = @productId AND
                (@startDate IS NULL OR p.PZA_FECALTA >= @startDate) AND
                (@endDateExclusive IS NULL OR p.PZA_FECALTA < @endDateExclusive) AND
                (@branchId IS NULL OR p.SUC_VENTA = @branchId) AND
                (@channelId IS NULL OR p.VDO_IDCANALVENTA = @channelId) AND
                (@planId IS NULL OR p.PLA_ID = @planId) AND
                (@sellerId IS NULL OR EXISTS (
                    SELECT 1
                    FROM PZA_VENDEDORES_CANAL_VTA pvc
                    WHERE pvc.PZA_NROSOL = p.PZA_NROSOL
                      AND pvc.VCV_ID = @sellerId
                ))
            GROUP BY pr.PRO_ID, pr.TPR_ID, pr.PRO_DESCRIPCION;
            """;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        int resolvedProductId;
        int productTypeId;
        string productName;
        int policiesSold;
        int uniqueClients;
        decimal totalPremium;
        DateTime? lastPolicyDate;

        await using (var command = CreateCommand(connection, sql, normalized))
        {
            command.Parameters["@productId"].Value = productId;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                return null;
            }

            resolvedProductId = ReadInt32(reader, 0);
            productTypeId = ReadInt32(reader, 1);
            productName = ReadString(reader, 2) ?? "Producto sin descripcion";
            policiesSold = ReadInt32(reader, 3);
            uniqueClients = ReadInt32(reader, 4);
            totalPremium = ReadDecimal(reader, 5);
            lastPolicyDate = ReadNullableDateTime(reader, 6);
        }

        var plansTask = ReadProductPlanBreakdownSafeAsync(connection, normalized, productId, cancellationToken);
        var branchesTask = ReadProductDimensionBreakdownSafeAsync(connection, normalized, productId, "branch", cancellationToken);
        var channelsTask = ReadProductDimensionBreakdownSafeAsync(connection, normalized, productId, "channel", cancellationToken);
        var sellersTask = ReadProductDimensionBreakdownSafeAsync(connection, normalized, productId, "seller", cancellationToken);

        await Task.WhenAll(plansTask, branchesTask, channelsTask, sellersTask);

        return new CommercialProductDetailResponseDto(
            ToFilters(normalized),
            resolvedProductId,
            productName,
            productTypeId,
            policiesSold,
            uniqueClients,
            totalPremium,
            lastPolicyDate,
            await plansTask,
            await branchesTask,
            await channelsTask,
            await sellersTask);
    }

    public async Task<CommercialClientDetailResponseDto?> GetClientDetailAsync(
        long clientId,
        CancellationToken cancellationToken = default)
    {
        const string summarySql = """
            SELECT TOP 1
                c.CLI_ID,
                COALESCE(
                    NULLIF(LTRIM(RTRIM(CONCAT(
                        CONVERT(nvarchar(200), c.CLI_APELLIDO),
                        N' ',
                        CONVERT(nvarchar(200), c.CLI_NOMBRE)
                    ))), N''),
                    NULLIF(CONVERT(nvarchar(200), c.CLI_RAZONSOCIAL), N''),
                    N'Cliente sin nombre'
                ) AS DISPLAY_NAME,
                COALESCE(
                    NULLIF(CONVERT(nvarchar(50), CONVERT(bigint, c.CLI_NRODOC)), N''),
                    NULLIF(CONVERT(nvarchar(50), CONVERT(bigint, c.CLI_IDENTE)), N'')
                ) AS DOCUMENT_NUMBER,
                CONVERT(nvarchar(160), c.CLI_EMAIL) AS EMAIL,
                (SELECT COUNT(*) FROM COTIZACIONES q WHERE q.CLI_ID = c.CLI_ID) AS TOTAL_QUOTES,
                (SELECT MAX(q.COT_FECHA) FROM COTIZACIONES q WHERE q.CLI_ID = c.CLI_ID) AS LAST_QUOTE_DATE,
                (SELECT COUNT(*) FROM POLIZAS p WHERE p.CLI_IDTITULAR = c.CLI_ID) AS TOTAL_POLICIES,
                (SELECT MAX(p.PZA_FECALTA) FROM POLIZAS p WHERE p.CLI_IDTITULAR = c.CLI_ID) AS LAST_POLICY_DATE,
                CASE
                    WHEN EXISTS (SELECT 1 FROM POLIZAS p WHERE p.CLI_IDTITULAR = c.CLI_ID) THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END AS HAS_ANY_POLICY,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM COTIZACIONES q
                        WHERE q.CLI_ID = c.CLI_ID
                          AND NOT EXISTS (
                              SELECT 1
                              FROM POLIZAS p
                              WHERE p.CLI_IDTITULAR = q.CLI_ID
                                AND p.PZA_FECALTA >= q.COT_FECHA
                          )
                    ) THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END AS HAS_QUOTES_WITHOUT_PURCHASE
            FROM EXT_CLIENTES c
            WHERE c.CLI_ID = @clientId;
            """;

        const string recentQuotesSql = """
            SELECT TOP 5
                q.COT_ID,
                q.COT_FECHA,
                q.TPR_ID,
                CONVERT(nvarchar(200), tp.TPR_DESCRIPCION) AS PRODUCT_TYPE_DESCRIPTION
            FROM COTIZACIONES q
            LEFT JOIN TIPO_PRODUCTOS tp
                ON tp.TPR_ID = q.TPR_ID
            WHERE q.CLI_ID = @clientId
            ORDER BY q.COT_FECHA DESC, q.COT_ID DESC;
            """;

        const string recentPoliciesSql = """
            SELECT TOP 5
                p.PZA_NROSOL,
                p.PZA_FECALTA,
                CONVERT(nvarchar(50), p.PZA_ESTADO) AS POLICY_STATUS,
                pr.PRO_ID,
                CONVERT(nvarchar(200), pr.PRO_DESCRIPCION) AS PRODUCT_NAME,
                pl.PLA_ID,
                CONVERT(nvarchar(200), pl.PLA_DESCRIPCION) AS PLAN_NAME
            FROM POLIZAS p
            LEFT JOIN PLANES pl
                ON pl.PLA_ID = p.PLA_ID
            LEFT JOIN PRODUCTOS pr
                ON pr.PRO_ID = pl.PRO_ID
            WHERE p.CLI_IDTITULAR = @clientId
            ORDER BY p.PZA_FECALTA DESC, p.PZA_NROSOL DESC;
            """;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        long resolvedClientId;
        string displayName;
        string? documentNumber;
        string? email;
        int totalQuotes;
        DateTime? lastQuoteDate;
        int totalPolicies;
        DateTime? lastPolicyDate;
        bool hasAnyPolicy;
        bool hasQuotesWithoutPurchase;

        await using (var command = connection.CreateCommand())
        {
            command.CommandText = summarySql;
            command.Parameters.Add(new SqlParameter("@clientId", SqlDbType.BigInt) { Value = clientId });

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                return null;
            }

            resolvedClientId = ReadInt64(reader, 0);
            displayName = ReadString(reader, 1) ?? "Cliente sin nombre";
            documentNumber = ReadString(reader, 2);
            email = ReadString(reader, 3);
            totalQuotes = ReadInt32(reader, 4);
            lastQuoteDate = ReadNullableDateTime(reader, 5);
            totalPolicies = ReadInt32(reader, 6);
            lastPolicyDate = ReadNullableDateTime(reader, 7);
            hasAnyPolicy = ReadBoolean(reader, 8);
            hasQuotesWithoutPurchase = ReadBoolean(reader, 9);
        }

        var recentQuotesTask = ReadClientRecentQuotesAsync(connection, recentQuotesSql, clientId, cancellationToken);
        var recentPoliciesTask = ReadClientRecentPoliciesAsync(connection, recentPoliciesSql, clientId, cancellationToken);
        await Task.WhenAll(recentQuotesTask, recentPoliciesTask);

        return new CommercialClientDetailResponseDto(
            resolvedClientId,
            displayName,
            documentNumber,
            email,
            totalQuotes,
            lastQuoteDate,
            totalPolicies,
            lastPolicyDate,
            hasAnyPolicy,
            hasQuotesWithoutPurchase,
            await recentQuotesTask,
            await recentPoliciesTask);
    }

    public async Task<(byte[] Content, string FileName)> ExportSummaryCsvAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var response = await GetSummaryAsync(query, cancellationToken);
        var topProduct = response.Summary.MostCommercializedProduct;

        var rows = new List<string[]>
        {
            new[] { "campo", "valor" },
            new[] { "polizas_vendidas", response.Summary.PoliciesSoldCount.ToString() },
            new[] { "producto_mas_comercializado", topProduct?.ProductName ?? "No disponible" },
            new[] { "producto_mas_comercializado_polizas", topProduct?.PoliciesSold.ToString() ?? "No disponible" },
            new[] { "clientes_sin_poliza", response.Summary.ClientsWithoutPoliciesCount.ToString() },
            new[] { "cotizaron_y_no_compraron", response.Summary.QuotedNotBoughtCount.ToString() },
            new[] { "regla_polizas_vendidas", response.Summary.Criteria.PoliciesSoldRule },
            new[] { "regla_producto_comercializado", response.Summary.Criteria.ProductCommercializationRule },
            new[] { "regla_cliente_sin_poliza", response.Summary.Criteria.ClientsWithoutPoliciesRule },
            new[] { "regla_cotizo_y_no_compro", response.Summary.Criteria.QuotedNotBoughtRule }
        };

        foreach (var item in response.Summary.PolicyStatusBreakdown)
        {
            rows.Add(new[] { $"estado_poliza_{item.Status}", item.Count.ToString() });
        }

        foreach (var limitation in response.Summary.Criteria.Limitations)
        {
            rows.Add(new[] { "limitacion", limitation });
        }

        return (BuildCsv(rows), BuildExportFileName("commercial_summary"));
    }

    public async Task<(byte[] Content, string FileName)> ExportClientsWithoutPoliciesCsvAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var exportQuery = NormalizeForExport(query, "displayName", "asc");
        var response = await GetClientsWithoutPoliciesAsync(exportQuery, cancellationToken);

        var rows = new List<string[]>
        {
            new[] { "client_id", "cliente", "documento", "email", "tiene_cotizaciones", "ultima_cotizacion" }
        };

        if (response.Items.Count == 0)
        {
            rows.Add(new[] { "", "Sin datos disponibles para el recorte actual", "", "", "", "" });
        }
        else
        {
            rows.AddRange(response.Items.Select(item => new[]
            {
                item.ClientId.ToString(),
                item.DisplayName,
                item.DocumentNumber ?? string.Empty,
                item.Email ?? string.Empty,
                item.HasQuotes ? "Si" : "No",
                item.LastQuoteDate?.ToString("yyyy-MM-dd") ?? string.Empty
            }));
        }

        return (BuildCsv(rows), BuildExportFileName("clients_without_policies"));
    }

    public async Task<(byte[] Content, string FileName)> ExportQuotedNotBoughtCsvAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var exportQuery = NormalizeForExport(query, "quoteDate", "desc");
        var response = await GetQuotedNotBoughtAsync(exportQuery, cancellationToken);

        var rows = new List<string[]>
        {
            new[] { "client_id", "cliente", "documento", "email", "quote_id", "quote_date", "product_type_id", "product_type_description" }
        };

        if (response.Items.Count == 0)
        {
            rows.Add(new[] { "", "Sin datos disponibles para el recorte actual", "", "", "", "", "", "" });
        }
        else
        {
            rows.AddRange(response.Items.Select(item => new[]
            {
                item.ClientId.ToString(),
                item.DisplayName,
                item.DocumentNumber ?? string.Empty,
                item.Email ?? string.Empty,
                item.QuoteId.ToString(),
                item.QuoteDate.ToString("yyyy-MM-dd"),
                item.ProductTypeId.ToString(),
                item.ProductTypeDescription ?? string.Empty
            }));
        }

        return (BuildCsv(rows), BuildExportFileName("quoted_not_bought"));
    }

    private async Task<int> ReadPolicyCountAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            SELECT COUNT(*)
            FROM POLIZAS p
            INNER JOIN PLANES pl
                ON pl.PLA_ID = p.PLA_ID
            INNER JOIN PRODUCTOS pr
                ON pr.PRO_ID = pl.PRO_ID
            WHERE {BuildPolicyWhereClause()}
            """;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken) ?? 0);
    }

    private async Task<IReadOnlyList<CommercialStatusCountDto>> ReadPolicyStatusBreakdownAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            SELECT
                CAST(p.PZA_ESTADO AS nvarchar(20)) AS PZA_ESTADO,
                COUNT(*) AS QTY
            FROM POLIZAS p
            INNER JOIN PLANES pl
                ON pl.PLA_ID = p.PLA_ID
            INNER JOIN PRODUCTOS pr
                ON pr.PRO_ID = pl.PRO_ID
            WHERE {BuildPolicyWhereClause()}
            GROUP BY p.PZA_ESTADO
            ORDER BY COUNT(*) DESC, p.PZA_ESTADO;
            """;

        var items = new List<CommercialStatusCountDto>();

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new CommercialStatusCountDto(
                ReadString(reader, 0) ?? "unknown",
                ReadInt32(reader, 1)));
        }

        return items;
    }

    private async Task<int> ReadTopProductsCountAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            SELECT COUNT(*)
            FROM (
                SELECT pr.PRO_ID
                FROM POLIZAS p
                INNER JOIN PLANES pl
                    ON pl.PLA_ID = p.PLA_ID
                INNER JOIN PRODUCTOS pr
                    ON pr.PRO_ID = pl.PRO_ID
                WHERE {BuildPolicyWhereClause()}
                GROUP BY pr.PRO_ID
            ) grouped_products;
            """;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken) ?? 0);
    }

    private async Task<CommercialTopProductDto?> ReadTopProductHeadlineAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            SELECT TOP 1
                pr.PRO_ID,
                pr.TPR_ID,
                CONVERT(nvarchar(200), pr.PRO_DESCRIPCION) AS PRODUCT_NAME,
                COUNT(*) AS POLICIES_SOLD,
                CAST(0 AS int) AS UNIQUE_CLIENTS,
                SUM(COALESCE(p.PZA_PREMIOCALC, 0)) AS TOTAL_PREMIUM,
                MAX(p.PZA_FECALTA) AS LAST_POLICY_DATE
            FROM POLIZAS p
            INNER JOIN PLANES pl
                ON pl.PLA_ID = p.PLA_ID
            INNER JOIN PRODUCTOS pr
                ON pr.PRO_ID = pl.PRO_ID
            WHERE {BuildPolicyWhereClause()}
            GROUP BY pr.PRO_ID, pr.TPR_ID, pr.PRO_DESCRIPCION
            ORDER BY COUNT(*) DESC, CONVERT(nvarchar(200), pr.PRO_DESCRIPCION);
            """;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new CommercialTopProductDto(
            ReadInt32(reader, 0),
            ReadInt32(reader, 1),
            ReadString(reader, 2) ?? "Producto sin descripcion",
            ReadInt32(reader, 3),
            ReadInt32(reader, 4),
            ReadDecimal(reader, 5),
            ReadNullableDateTime(reader, 6));
    }

    private async Task<IReadOnlyList<CommercialTopProductDto>> ReadTopProductsCoreAsync(
        CommercialAnalyticsQueryDto query,
        int takeOverride,
        int offsetOverride,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            SELECT
                pr.PRO_ID,
                pr.TPR_ID,
                CONVERT(nvarchar(200), pr.PRO_DESCRIPCION) AS PRODUCT_NAME,
                COUNT(*) AS POLICIES_SOLD,
                CAST(0 AS int) AS UNIQUE_CLIENTS,
                SUM(COALESCE(p.PZA_PREMIOCALC, 0)) AS TOTAL_PREMIUM,
                MAX(p.PZA_FECALTA) AS LAST_POLICY_DATE
            FROM POLIZAS p
            INNER JOIN PLANES pl
                ON pl.PLA_ID = p.PLA_ID
            INNER JOIN PRODUCTOS pr
                ON pr.PRO_ID = pl.PRO_ID
            WHERE {BuildPolicyWhereClause()}
            GROUP BY pr.PRO_ID, pr.TPR_ID, pr.PRO_DESCRIPCION
            ORDER BY {BuildTopProductsOrderBy(query)}
            OFFSET @offset ROWS FETCH NEXT @take ROWS ONLY;
            """;

        var items = new List<CommercialTopProductDto>();

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, sql, query, takeOverride, offsetOverride, HeavyCommercialQueryTimeoutSeconds);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new CommercialTopProductDto(
                ReadInt32(reader, 0),
                ReadInt32(reader, 1),
                ReadString(reader, 2) ?? "Producto sin descripcion",
                ReadInt32(reader, 3),
                ReadInt32(reader, 4),
                ReadDecimal(reader, 5),
                ReadNullableDateTime(reader, 6)));
        }

        return items;
    }

    private async Task<int> ReadClientsWithoutPoliciesCountAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(*) FROM EXT_CLIENTES) -
                (SELECT COUNT(DISTINCT p.CLI_IDTITULAR) FROM POLIZAS p WHERE p.CLI_IDTITULAR IS NOT NULL);
            """;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.CommandTimeout = HeavyCommercialQueryTimeoutSeconds;
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken) ?? 0);
    }

    private async Task<int> ReadClientsWithoutPoliciesWithQuotesCountAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            WITH policy_holders AS (
                SELECT DISTINCT p.CLI_IDTITULAR
                FROM POLIZAS p
                WHERE p.CLI_IDTITULAR IS NOT NULL
            )
            SELECT COUNT(*)
            FROM (
                SELECT DISTINCT q.CLI_ID
                FROM COTIZACIONES q
                INNER JOIN EXT_CLIENTES c
                    ON c.CLI_ID = q.CLI_ID
                LEFT JOIN policy_holders holders
                    ON holders.CLI_IDTITULAR = c.CLI_ID
                WHERE holders.CLI_IDTITULAR IS NULL
            ) quoted_clients_without_policy;
            """;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.CommandTimeout = HeavyCommercialQueryTimeoutSeconds;
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken) ?? 0);
    }

    private async Task<IReadOnlyList<CommercialClientWithoutPolicyDto>> ReadClientsWithoutPoliciesItemsAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            WITH policy_holders AS (
                SELECT DISTINCT p.CLI_IDTITULAR
                FROM POLIZAS p
                WHERE p.CLI_IDTITULAR IS NOT NULL
            )
            SELECT
                c.CLI_ID,
                COALESCE(
                    NULLIF(LTRIM(RTRIM(CONCAT(
                        CONVERT(nvarchar(200), c.CLI_APELLIDO),
                        N' ',
                        CONVERT(nvarchar(200), c.CLI_NOMBRE)
                    ))), N''),
                    NULLIF(CONVERT(nvarchar(200), c.CLI_RAZONSOCIAL), N''),
                    N'Cliente sin nombre'
                ) AS DISPLAY_NAME,
                COALESCE(
                    NULLIF(CONVERT(nvarchar(50), CONVERT(bigint, c.CLI_NRODOC)), N''),
                    NULLIF(CONVERT(nvarchar(50), CONVERT(bigint, c.CLI_IDENTE)), N'')
                ) AS DOCUMENT_NUMBER,
                CONVERT(nvarchar(160), c.CLI_EMAIL) AS EMAIL
            FROM EXT_CLIENTES c
            LEFT JOIN policy_holders holders
                ON holders.CLI_IDTITULAR = c.CLI_ID
            WHERE holders.CLI_IDTITULAR IS NULL
            ORDER BY {BuildClientsWithoutPoliciesOrderBy(query)}
            OFFSET @offset ROWS FETCH NEXT @take ROWS ONLY;
            """;

        var rows = new List<(long ClientId, string DisplayName, string? DocumentNumber, string? Email)>();

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add((
                ReadInt64(reader, 0),
                ReadString(reader, 1) ?? "Cliente sin nombre",
                ReadString(reader, 2),
                ReadString(reader, 3)));
        }

        var quoteSummary = await ReadClientQuoteSummaryAsync(connection, rows.Select(row => row.ClientId).ToArray(), cancellationToken);
        var items = rows
            .Select(row =>
            {
                quoteSummary.TryGetValue(row.ClientId, out var quoteData);
                return new CommercialClientWithoutPolicyDto(
                    row.ClientId,
                    row.DisplayName,
                    row.DocumentNumber,
                    row.Email,
                    quoteData.HasValue,
                    quoteData.LastQuoteDate);
            })
            .ToList();

        return items;
    }

    private async Task<Dictionary<long, (bool HasValue, DateTime? LastQuoteDate)>> ReadClientQuoteSummaryAsync(
        SqlConnection connection,
        IReadOnlyList<long> clientIds,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<long, (bool HasValue, DateTime? LastQuoteDate)>();
        if (clientIds.Count == 0)
        {
            return result;
        }

        var parameterNames = new List<string>(clientIds.Count);
        await using var command = connection.CreateCommand();
        command.CommandTimeout = HeavyCommercialQueryTimeoutSeconds;

        for (var index = 0; index < clientIds.Count; index++)
        {
            var parameterName = $"@clientId{index}";
            parameterNames.Add(parameterName);
            command.Parameters.Add(new SqlParameter(parameterName, SqlDbType.BigInt)
            {
                Value = clientIds[index]
            });
        }

        command.CommandText = $"""
            SELECT
                q.CLI_ID,
                MAX(q.COT_FECHA) AS LAST_QUOTE_DATE
            FROM COTIZACIONES q
            WHERE q.CLI_ID IN ({string.Join(", ", parameterNames)})
            GROUP BY q.CLI_ID;
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result[ReadInt64(reader, 0)] = (true, ReadNullableDateTime(reader, 1));
        }

        return result;
    }

    private async Task<(int TotalCount, int BoughtAfterQuoteCount, int NeverHadPolicyCount, int UnclassifiedCount)> ReadQuotedNotBoughtCountsAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken)
    {
        const string sql = """
            WITH latest_quotes AS (
                SELECT
                    c.CLI_ID,
                    c.COT_ID,
                    c.COT_FECHA,
                    c.TPR_ID,
                    ROW_NUMBER() OVER (
                        PARTITION BY c.CLI_ID
                        ORDER BY c.COT_FECHA DESC, c.COT_ID DESC
                    ) AS RN
                FROM COTIZACIONES c
                WHERE
                    c.CLI_ID IS NOT NULL AND
                    (@startDate IS NULL OR c.COT_FECHA >= @startDate) AND
                    (@endDateExclusive IS NULL OR c.COT_FECHA < @endDateExclusive)
            ),
            classified_quotes AS (
                SELECT
                    q.CLI_ID,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM POLIZAS p
                            WHERE p.CLI_IDTITULAR = q.CLI_ID
                              AND p.PZA_FECALTA >= q.COT_FECHA
                        ) THEN 1
                        ELSE 0
                    END AS BOUGHT_AFTER_QUOTE,
                    CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM POLIZAS p
                            WHERE p.CLI_IDTITULAR = q.CLI_ID
                        ) THEN 1
                        ELSE 0
                    END AS NEVER_HAD_POLICY
                FROM latest_quotes q
                WHERE q.RN = 1
            )
            SELECT
                COUNT(*) AS TOTAL_COUNT,
                SUM(CASE WHEN cq.BOUGHT_AFTER_QUOTE = 1 THEN 1 ELSE 0 END) AS BOUGHT_AFTER_QUOTE_COUNT,
                SUM(CASE WHEN cq.NEVER_HAD_POLICY = 1 THEN 1 ELSE 0 END) AS NEVER_HAD_POLICY_COUNT,
                SUM(CASE WHEN cq.BOUGHT_AFTER_QUOTE = 0 AND cq.NEVER_HAD_POLICY = 0 THEN 1 ELSE 0 END) AS UNCLASSIFIED_COUNT
            FROM classified_quotes cq
            WHERE cq.BOUGHT_AFTER_QUOTE = 1 OR cq.NEVER_HAD_POLICY = 1;
            """;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return (0, 0, 0, 0);
        }

        return (
            ReadInt32(reader, 0),
            ReadInt32(reader, 1),
            ReadInt32(reader, 2),
            ReadInt32(reader, 3));
    }

    private async Task<IReadOnlyList<CommercialQuotedNotBoughtDto>> ReadQuotedNotBoughtItemsAsync(
        CommercialAnalyticsQueryDto query,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            WITH latest_quotes AS (
                SELECT
                    c.CLI_ID,
                    c.COT_ID,
                    c.COT_FECHA,
                    c.TPR_ID,
                    ROW_NUMBER() OVER (
                        PARTITION BY c.CLI_ID
                        ORDER BY c.COT_FECHA DESC, c.COT_ID DESC
                    ) AS RN
                FROM COTIZACIONES c
                WHERE
                    c.CLI_ID IS NOT NULL AND
                    (@startDate IS NULL OR c.COT_FECHA >= @startDate) AND
                    (@endDateExclusive IS NULL OR c.COT_FECHA < @endDateExclusive)
            )
            SELECT
                q.CLI_ID,
                COALESCE(
                    NULLIF(LTRIM(RTRIM(CONCAT(
                        CONVERT(nvarchar(200), c.CLI_APELLIDO),
                        N' ',
                        CONVERT(nvarchar(200), c.CLI_NOMBRE)
                    ))), N''),
                    NULLIF(CONVERT(nvarchar(200), c.CLI_RAZONSOCIAL), N''),
                    N'Cliente sin nombre'
                ) AS DISPLAY_NAME,
                COALESCE(
                    NULLIF(CONVERT(nvarchar(50), CONVERT(bigint, c.CLI_NRODOC)), N''),
                    NULLIF(CONVERT(nvarchar(50), CONVERT(bigint, c.CLI_IDENTE)), N'')
                ) AS DOCUMENT_NUMBER,
                CONVERT(nvarchar(160), c.CLI_EMAIL) AS EMAIL,
                q.COT_ID,
                q.COT_FECHA,
                q.TPR_ID,
                CONVERT(nvarchar(200), tp.TPR_DESCRIPCION) AS PRODUCT_TYPE_DESCRIPTION,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM POLIZAS p
                        WHERE p.CLI_IDTITULAR = q.CLI_ID
                          AND p.PZA_FECALTA >= q.COT_FECHA
                    ) THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END AS BOUGHT_POLICY_AFTER_QUOTE,
                CASE
                    WHEN NOT EXISTS (
                        SELECT 1
                        FROM POLIZAS p
                        WHERE p.CLI_IDTITULAR = q.CLI_ID
                    ) THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END AS NEVER_HAD_POLICY
            FROM latest_quotes q
            INNER JOIN EXT_CLIENTES c
                ON c.CLI_ID = q.CLI_ID
            LEFT JOIN TIPO_PRODUCTOS tp
                ON tp.TPR_ID = q.TPR_ID
            WHERE
                q.RN = 1 AND
                (
                    EXISTS (
                        SELECT 1
                        FROM POLIZAS p
                        WHERE p.CLI_IDTITULAR = q.CLI_ID
                          AND p.PZA_FECALTA >= q.COT_FECHA
                    )
                    OR NOT EXISTS (
                        SELECT 1
                        FROM POLIZAS p
                        WHERE p.CLI_IDTITULAR = q.CLI_ID
                    )
                )
            ORDER BY {BuildQuotedNotBoughtOrderBy(query)}
            OFFSET @offset ROWS FETCH NEXT @take ROWS ONLY;
            """;

        var items = new List<CommercialQuotedNotBoughtDto>();

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new CommercialQuotedNotBoughtDto(
                ReadInt64(reader, 0),
                ReadString(reader, 1) ?? "Cliente sin nombre",
                ReadString(reader, 2),
                ReadString(reader, 3),
                ReadInt32(reader, 4),
                ReadDateTime(reader, 5),
                ReadInt32(reader, 6),
                ReadString(reader, 7),
                ReadBoolean(reader, 8),
                ReadBoolean(reader, 9)));
        }

        return items;
    }

    private async Task<IReadOnlyList<CommercialPlanBreakdownDto>> ReadProductPlanBreakdownAsync(
        SqlConnection connection,
        CommercialAnalyticsQueryDto query,
        int productId,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            SELECT TOP 10
                pl.PLA_ID,
                CONVERT(nvarchar(200), pl.PLA_DESCRIPCION) AS PLAN_NAME,
                COUNT(*) AS POLICIES_SOLD
            FROM POLIZAS p
            INNER JOIN PLANES pl
                ON pl.PLA_ID = p.PLA_ID
            INNER JOIN PRODUCTOS pr
                ON pr.PRO_ID = pl.PRO_ID
            WHERE
                pr.PRO_ID = @productId AND
                {BuildPolicyWhereClause(includeProductFilter: false)}
            GROUP BY pl.PLA_ID, pl.PLA_DESCRIPCION
            ORDER BY COUNT(*) DESC, pl.PLA_ID;
            """;

        var items = new List<CommercialPlanBreakdownDto>();
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        command.Parameters["@productId"].Value = productId;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new CommercialPlanBreakdownDto(
                ReadInt32(reader, 0),
                ReadString(reader, 1) ?? "Plan sin descripcion",
                ReadInt32(reader, 2),
                0,
                0m));
        }

        return items;
    }

    private async Task<IReadOnlyList<CommercialDimensionBreakdownDto>> ReadProductDimensionBreakdownAsync(
        SqlConnection connection,
        CommercialAnalyticsQueryDto query,
        int productId,
        string dimension,
        CancellationToken cancellationToken)
    {
        var (selectSql, groupSql, orderSql) = dimension switch
        {
            "branch" => (
                "COALESCE(CONVERT(nvarchar(200), s.SUC_NOMBRE), N'Sin sucursal') AS LABEL, COALESCE(p.SUC_VENTA, 0) AS VALUE",
                "COALESCE(CONVERT(nvarchar(200), s.SUC_NOMBRE), N'Sin sucursal'), COALESCE(p.SUC_VENTA, 0)",
                "COUNT(*) DESC, COALESCE(CONVERT(nvarchar(200), s.SUC_NOMBRE), N'Sin sucursal')"),
            "channel" => (
                "CONCAT(N'Canal ', CONVERT(nvarchar(50), COALESCE(p.VDO_IDCANALVENTA, 0))) AS LABEL, COALESCE(p.VDO_IDCANALVENTA, 0) AS VALUE",
                "COALESCE(p.VDO_IDCANALVENTA, 0)",
                "COUNT(*) DESC, COALESCE(p.VDO_IDCANALVENTA, 0)"),
            _ => (
                "COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(CONVERT(nvarchar(100), v.VCV_APELLIDO), N' ', CONVERT(nvarchar(100), v.VCV_NOMBRE)))), N''), CONCAT(N'Vendedor ', CONVERT(nvarchar(50), COALESCE(v.VCV_ID, 0)))) AS LABEL, COALESCE(v.VCV_ID, 0) AS VALUE",
                "COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(CONVERT(nvarchar(100), v.VCV_APELLIDO), N' ', CONVERT(nvarchar(100), v.VCV_NOMBRE)))), N''), CONCAT(N'Vendedor ', CONVERT(nvarchar(50), COALESCE(v.VCV_ID, 0)))), COALESCE(v.VCV_ID, 0)",
                "COUNT(*) DESC, COALESCE(v.VCV_ID, 0)")
        };

        var joins = dimension switch
        {
            "branch" => """
                LEFT JOIN SUCURSALES s
                    ON s.SUC_ID = p.SUC_VENTA
                """,
            "channel" => string.Empty,
            _ => """
                LEFT JOIN PZA_VENDEDORES_CANAL_VTA pvc
                    ON pvc.PZA_NROSOL = p.PZA_NROSOL
                LEFT JOIN VENDEDORES_CANAL_VTA v
                    ON v.VCV_ID = pvc.VCV_ID
                """
        };

        var sql = $"""
            SELECT TOP 10
                {selectSql},
                COUNT(*) AS POLICIES_SOLD
            FROM POLIZAS p
            INNER JOIN PLANES pl
                ON pl.PLA_ID = p.PLA_ID
            INNER JOIN PRODUCTOS pr
                ON pr.PRO_ID = pl.PRO_ID
            {joins}
            WHERE
                pr.PRO_ID = @productId AND
                {BuildPolicyWhereClause(includeProductFilter: false)}
            GROUP BY {groupSql}
            ORDER BY {orderSql};
            """;

        var items = new List<CommercialDimensionBreakdownDto>();
        await using var command = CreateCommand(connection, sql, query, commandTimeoutSeconds: HeavyCommercialQueryTimeoutSeconds);
        command.Parameters["@productId"].Value = productId;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new CommercialDimensionBreakdownDto(
                ReadString(reader, 0) ?? "Sin dato",
                ReadInt32(reader, 1),
                ReadInt32(reader, 2),
                0,
                0m));
        }

        return items;
    }

    private async Task<IReadOnlyList<CommercialPlanBreakdownDto>> ReadProductPlanBreakdownSafeAsync(
        SqlConnection connection,
        CommercialAnalyticsQueryDto query,
        int productId,
        CancellationToken cancellationToken)
    {
        try
        {
            return await ReadProductPlanBreakdownAsync(connection, query, productId, cancellationToken);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            return Array.Empty<CommercialPlanBreakdownDto>();
        }
    }

    private async Task<IReadOnlyList<CommercialDimensionBreakdownDto>> ReadProductDimensionBreakdownSafeAsync(
        SqlConnection connection,
        CommercialAnalyticsQueryDto query,
        int productId,
        string dimension,
        CancellationToken cancellationToken)
    {
        try
        {
            return await ReadProductDimensionBreakdownAsync(connection, query, productId, dimension, cancellationToken);
        }
        catch (SqlException ex) when (IsSqlTimeout(ex))
        {
            return Array.Empty<CommercialDimensionBreakdownDto>();
        }
    }

    private static async Task<IReadOnlyList<CommercialClientQuoteSummaryDto>> ReadClientRecentQuotesAsync(
        SqlConnection connection,
        string sql,
        long clientId,
        CancellationToken cancellationToken)
    {
        var items = new List<CommercialClientQuoteSummaryDto>();
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.Add(new SqlParameter("@clientId", SqlDbType.BigInt) { Value = clientId });
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new CommercialClientQuoteSummaryDto(
                ReadInt32(reader, 0),
                ReadDateTime(reader, 1),
                ReadInt32(reader, 2),
                ReadString(reader, 3)));
        }

        return items;
    }

    private static async Task<IReadOnlyList<CommercialClientPolicySummaryDto>> ReadClientRecentPoliciesAsync(
        SqlConnection connection,
        string sql,
        long clientId,
        CancellationToken cancellationToken)
    {
        var items = new List<CommercialClientPolicySummaryDto>();
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.Add(new SqlParameter("@clientId", SqlDbType.BigInt) { Value = clientId });
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new CommercialClientPolicySummaryDto(
                ReadInt64(reader, 0),
                ReadNullableDateTime(reader, 1),
                ReadString(reader, 2),
                ReadNullableInt32(reader, 3),
                ReadString(reader, 4),
                ReadNullableInt32(reader, 5),
                ReadString(reader, 6)));
        }

        return items;
    }

    private SqlConnection CreateConnection()
    {
        var connectionString =
            _claimsDbContext.Database.GetConnectionString()
            ?? _claimsDbContext.Database.GetDbConnection().ConnectionString;

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("La cadena de conexion DefaultConnection no esta configurada.");
        }

        return new SqlConnection(connectionString);
    }

    private static SqlCommand CreateCommand(
        SqlConnection connection,
        string sql,
        CommercialAnalyticsQueryDto query,
        int? takeOverride = null,
        int? offsetOverride = null,
        int? commandTimeoutSeconds = null)
    {
        var command = connection.CreateCommand();
        command.CommandText = sql;
        command.CommandTimeout = commandTimeoutSeconds ?? 90;
        command.Parameters.Add(new SqlParameter("@startDate", SqlDbType.DateTime2)
        {
            Value = (object?)query.StartDate ?? DBNull.Value
        });
        command.Parameters.Add(new SqlParameter("@endDateExclusive", SqlDbType.DateTime2)
        {
            Value = (object?)ToExclusiveEndDate(query.EndDate) ?? DBNull.Value
        });
        command.Parameters.Add(new SqlParameter("@branchId", SqlDbType.Int)
        {
            Value = (object?)query.BranchId ?? DBNull.Value
        });
        command.Parameters.Add(new SqlParameter("@channelId", SqlDbType.Int)
        {
            Value = (object?)query.ChannelId ?? DBNull.Value
        });
        command.Parameters.Add(new SqlParameter("@productId", SqlDbType.Int)
        {
            Value = (object?)query.ProductId ?? DBNull.Value
        });
        command.Parameters.Add(new SqlParameter("@planId", SqlDbType.Int)
        {
            Value = (object?)query.PlanId ?? DBNull.Value
        });
        command.Parameters.Add(new SqlParameter("@sellerId", SqlDbType.Int)
        {
            Value = (object?)query.SellerId ?? DBNull.Value
        });
        command.Parameters.Add(new SqlParameter("@take", SqlDbType.Int)
        {
            Value = takeOverride ?? query.Take
        });
        command.Parameters.Add(new SqlParameter("@offset", SqlDbType.Int)
        {
            Value = offsetOverride ?? query.Offset
        });

        return command;
    }

    private static string BuildPolicyWhereClause(bool includeProductFilter = true)
    {
        var conditions = new List<string>
        {
            "(@startDate IS NULL OR p.PZA_FECALTA >= @startDate)",
            "(@endDateExclusive IS NULL OR p.PZA_FECALTA < @endDateExclusive)",
            "(@branchId IS NULL OR p.SUC_VENTA = @branchId)",
            "(@channelId IS NULL OR p.VDO_IDCANALVENTA = @channelId)"
        };

        if (includeProductFilter)
        {
            conditions.Add("(@productId IS NULL OR pr.PRO_ID = @productId)");
        }

        conditions.Add("(@planId IS NULL OR p.PLA_ID = @planId)");
        conditions.Add("""
            (@sellerId IS NULL OR EXISTS (
                SELECT 1
                FROM PZA_VENDEDORES_CANAL_VTA pvc
                WHERE pvc.PZA_NROSOL = p.PZA_NROSOL
                  AND pvc.VCV_ID = @sellerId
            ))
            """);

        return string.Join($"{Environment.NewLine}    AND ", conditions);
    }

    private static IReadOnlyList<string> BuildSummaryUnsupportedFilters()
        => new[]
        {
            "date is ignored for clientsWithoutPolicies",
            "branch is ignored for clientsWithoutPolicies and quotedNotBought",
            "channel is ignored for clientsWithoutPolicies and quotedNotBought",
            "product and plan are ignored for clientsWithoutPolicies and quotedNotBought",
            "seller is ignored for clientsWithoutPolicies and quotedNotBought"
        };

    private static string BuildTopProductsOrderBy(CommercialAnalyticsQueryDto query)
    {
        var descending = IsDescending(query.SortDirection);
        return query.SortBy?.Trim().ToLowerInvariant() switch
        {
            "name" => $"CONVERT(nvarchar(200), pr.PRO_DESCRIPCION) {(descending ? "DESC" : "ASC")}, pr.PRO_ID",
            "uniqueclients" => $"COUNT(*) {(descending ? "DESC" : "ASC")}, CONVERT(nvarchar(200), pr.PRO_DESCRIPCION)",
            "totalpremium" => $"SUM(COALESCE(p.PZA_PREMIOCALC, 0)) {(descending ? "DESC" : "ASC")}, COUNT(*) DESC",
            "lastpolicydate" => $"MAX(p.PZA_FECALTA) {(descending ? "DESC" : "ASC")}, COUNT(*) DESC",
            _ => $"COUNT(*) {(descending ? "DESC" : "ASC")}, CONVERT(nvarchar(200), pr.PRO_DESCRIPCION)"
        };
    }

    private static string BuildClientsWithoutPoliciesOrderBy(CommercialAnalyticsQueryDto query)
    {
        var descending = IsDescending(query.SortDirection);
        return query.SortBy?.Trim().ToLowerInvariant() switch
        {
            "displayname" => $"DISPLAY_NAME {(descending ? "DESC" : "ASC")}, c.CLI_ID",
            "lastquotedate" => $"DISPLAY_NAME {(descending ? "DESC" : "ASC")}, c.CLI_ID",
            "hasquotes" => $"DISPLAY_NAME {(descending ? "DESC" : "ASC")}, c.CLI_ID",
            _ => $"c.CLI_ID {(descending ? "DESC" : "ASC")}"
        };
    }

    private static string BuildQuotedNotBoughtOrderBy(CommercialAnalyticsQueryDto query)
    {
        var descending = IsDescending(query.SortDirection);
        return query.SortBy?.Trim().ToLowerInvariant() switch
        {
            "displayname" => $"DISPLAY_NAME {(descending ? "DESC" : "ASC")}, q.COT_FECHA DESC",
            "conversionstatus" => $"CASE WHEN NEVER_HAD_POLICY = 1 THEN 1 ELSE 0 END {(descending ? "DESC" : "ASC")}, q.COT_FECHA DESC",
            "producttype" => $"PRODUCT_TYPE_DESCRIPTION {(descending ? "DESC" : "ASC")}, q.COT_FECHA DESC",
            _ => $"q.COT_FECHA {(descending ? "DESC" : "ASC")}, q.COT_ID {(descending ? "DESC" : "ASC")}"
        };
    }

    private static bool IsDescending(string? direction)
        => !string.Equals(direction?.Trim(), "asc", StringComparison.OrdinalIgnoreCase);

    private static bool IsSqlTimeout(SqlException exception)
        => exception.Number == -2;

    private static int EstimatePagedTotalCount(CommercialAnalyticsQueryDto query, int itemCount)
    {
        var take = query.Take ?? 50;
        var offset = query.Offset ?? 0;
        return itemCount < take ? offset + itemCount : offset + itemCount + 1;
    }

    private static CommercialAnalyticsQueryDto Normalize(CommercialAnalyticsQueryDto? query)
    {
        var take = Math.Clamp(query?.Take ?? 50, 1, 200);
        var offset = Math.Max(query?.Offset ?? 0, 0);

        return new CommercialAnalyticsQueryDto
        {
            StartDate = query?.StartDate?.Date,
            EndDate = query?.EndDate?.Date,
            BranchId = query?.BranchId,
            ChannelId = query?.ChannelId,
            ProductId = query?.ProductId,
            PlanId = query?.PlanId,
            SellerId = query?.SellerId,
            SortBy = string.IsNullOrWhiteSpace(query?.SortBy) ? null : query.SortBy!.Trim(),
            SortDirection = string.IsNullOrWhiteSpace(query?.SortDirection) ? "desc" : query.SortDirection!.Trim(),
            Take = take,
            Offset = offset
        };
    }

    private static CommercialAnalyticsQueryDto NormalizeForExport(
        CommercialAnalyticsQueryDto query,
        string sortBy,
        string sortDirection)
    {
        var normalized = Normalize(query);
        return new CommercialAnalyticsQueryDto
        {
            StartDate = normalized.StartDate,
            EndDate = normalized.EndDate,
            BranchId = normalized.BranchId,
            ChannelId = normalized.ChannelId,
            ProductId = normalized.ProductId,
            PlanId = normalized.PlanId,
            SellerId = normalized.SellerId,
            SortBy = string.IsNullOrWhiteSpace(normalized.SortBy) ? sortBy : normalized.SortBy,
            SortDirection = string.IsNullOrWhiteSpace(normalized.SortDirection) ? sortDirection : normalized.SortDirection,
            Take = 5000,
            Offset = 0
        };
    }

    private static byte[] BuildCsv(IEnumerable<string[]> rows)
    {
        var csv = string.Join(
            Environment.NewLine,
            rows.Select(row => string.Join(",", row.Select(EscapeCsvValue))));

        return System.Text.Encoding.UTF8.GetBytes(csv);
    }

    private static string EscapeCsvValue(string? value)
    {
        var normalized = value ?? string.Empty;
        return $"\"{normalized.Replace("\"", "\"\"")}\"";
    }

    private static string BuildExportFileName(string prefix)
        => $"{prefix}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";

    private static CommercialAppliedFiltersDto ToFilters(CommercialAnalyticsQueryDto query)
        => new(
            query.StartDate,
            query.EndDate,
            query.BranchId,
            query.ChannelId,
            query.ProductId,
            query.PlanId,
            query.SellerId,
            query.SortBy,
            query.SortDirection,
            query.Take ?? 50,
            query.Offset ?? 0);

    private static CommercialBusinessCriteriaDto BuildCriteria()
        => new(
            "Se considera poliza vendida de manera operativa a toda fila existente en POLIZAS, filtrada por PZA_FECALTA y dimensiones comerciales disponibles. No se excluyen estados porque en este sprint no hay catalogo funcional de PZA_ESTADO validado por negocio.",
            "El producto mas comercializado se calcula agrupando POLIZAS -> PLANES -> PRODUCTOS por PRODUCTOS.PRO_ID y contando polizas. Cuando se informa planId, el recorte se limita a ese plan.",
            "Cliente sin poliza es todo cliente de EXT_CLIENTES que no aparece como titular en POLIZAS. Esta definicion no soporta filtros comerciales porque esos atributos no existen para clientes sin emision.",
            "Cotizo pero no compro es el cliente cuya ultima cotizacion en COTIZACIONES no tiene una poliza posterior por CLI_ID. Se usa la ultima cotizacion por cliente para evitar duplicados.",
            new[]
            {
                "No existe en la base inspeccionada una llave explicita que una COTIZACIONES con una emision concreta de POLIZAS.",
                "COTIZACIONES expone TPR_ID, pero las polizas se filtran por PRODUCTOS.PRO_ID y PLANES.PLA_ID; por eso productId y planId no se aplican al listado quotedNotBought.",
                "El filtro seller esta disponible solo para polizas con registro en PZA_VENDEDORES_CANAL_VTA; la cobertura observada en base es parcial.",
                "WS_EMISION_POLIZA existe, pero no cubre historicamente todo el universo de POLIZAS; por eso no se usa como fuente principal del dashboard."
            });

    private static DateTime? ToExclusiveEndDate(DateTime? endDate)
        => endDate?.Date.AddDays(1);

    private static string? ReadString(SqlDataReader reader, int ordinal)
        => reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);

    private static int ReadInt32(SqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return 0;
        }

        var value = reader.GetValue(ordinal);
        return value switch
        {
            int intValue => intValue,
            short shortValue => shortValue,
            long longValue => (int)longValue,
            decimal decimalValue => (int)decimalValue,
            _ => Convert.ToInt32(value)
        };
    }

    private static int? ReadNullableInt32(SqlDataReader reader, int ordinal)
        => reader.IsDBNull(ordinal) ? null : ReadInt32(reader, ordinal);

    private static long ReadInt64(SqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return 0L;
        }

        var value = reader.GetValue(ordinal);
        return value switch
        {
            long longValue => longValue,
            int intValue => intValue,
            short shortValue => shortValue,
            decimal decimalValue => (long)decimalValue,
            _ => Convert.ToInt64(value)
        };
    }

    private static decimal ReadDecimal(SqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return 0m;
        }

        var value = reader.GetValue(ordinal);
        return value switch
        {
            decimal decimalValue => decimalValue,
            double doubleValue => (decimal)doubleValue,
            float floatValue => (decimal)floatValue,
            int intValue => intValue,
            long longValue => longValue,
            _ => Convert.ToDecimal(value)
        };
    }

    private static bool ReadBoolean(SqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return false;
        }

        var value = reader.GetValue(ordinal);
        return value switch
        {
            bool boolValue => boolValue,
            byte byteValue => byteValue != 0,
            short shortValue => shortValue != 0,
            int intValue => intValue != 0,
            _ => Convert.ToBoolean(value)
        };
    }

    private static DateTime ReadDateTime(SqlDataReader reader, int ordinal)
        => reader.GetDateTime(ordinal);

    private static DateTime? ReadNullableDateTime(SqlDataReader reader, int ordinal)
        => reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
}
