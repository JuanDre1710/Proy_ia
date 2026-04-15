namespace Ers.SqlServerApi.Application;

public sealed class CommercialAnalyticsQueryDto
{
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public int? BranchId { get; init; }
    public int? ChannelId { get; init; }
    public int? ProductId { get; init; }
    public int? PlanId { get; init; }
    public int? SellerId { get; init; }
    public string? SortBy { get; init; }
    public string? SortDirection { get; init; }
    public int? Take { get; init; }
    public int? Offset { get; init; }
}

public sealed record CommercialAppliedFiltersDto(
    DateTime? StartDate,
    DateTime? EndDate,
    int? BranchId,
    int? ChannelId,
    int? ProductId,
    int? PlanId,
    int? SellerId,
    string? SortBy,
    string? SortDirection,
    int Take,
    int Offset
);

public sealed record CommercialFilterSupportDto(
    bool Date,
    bool Branch,
    bool Channel,
    bool Product,
    bool Seller
);

public sealed record CommercialBusinessCriteriaDto(
    string PoliciesSoldRule,
    string ProductCommercializationRule,
    string ClientsWithoutPoliciesRule,
    string QuotedNotBoughtRule,
    IReadOnlyList<string> Limitations
);

public sealed record CommercialStatusCountDto(
    string Status,
    int Count
);

public sealed record CommercialTopProductDto(
    int ProductId,
    int ProductTypeId,
    string ProductName,
    int PoliciesSold,
    int UniqueClients,
    decimal TotalPremium,
    DateTime? LastPolicyDate
);

public sealed record CommercialSummaryDto(
    int PoliciesSoldCount,
    CommercialTopProductDto? MostCommercializedProduct,
    int ClientsWithoutPoliciesCount,
    int QuotedNotBoughtCount,
    IReadOnlyList<CommercialStatusCountDto> PolicyStatusBreakdown,
    CommercialBusinessCriteriaDto Criteria
);

public sealed record CommercialSummaryResponseDto(
    CommercialAppliedFiltersDto Filters,
    CommercialFilterSupportDto SupportedFilters,
    IReadOnlyList<string> UnsupportedFilters,
    CommercialSummaryDto Summary
);

public sealed record CommercialTopProductsResponseDto(
    CommercialAppliedFiltersDto Filters,
    CommercialFilterSupportDto SupportedFilters,
    IReadOnlyList<string> UnsupportedFilters,
    int TotalCount,
    int Offset,
    int Take,
    IReadOnlyList<CommercialTopProductDto> Items
);

public sealed record CommercialClientWithoutPolicyDto(
    long ClientId,
    string DisplayName,
    string? DocumentNumber,
    string? Email,
    bool HasQuotes,
    DateTime? LastQuoteDate
);

public sealed record CommercialClientsWithoutPoliciesResponseDto(
    CommercialAppliedFiltersDto Filters,
    CommercialFilterSupportDto SupportedFilters,
    IReadOnlyList<string> UnsupportedFilters,
    int TotalCount,
    int Offset,
    int Take,
    IReadOnlyList<CommercialClientWithoutPolicyDto> Items
);

public sealed record CommercialQuotedNotBoughtDto(
    long ClientId,
    string DisplayName,
    string? DocumentNumber,
    string? Email,
    int QuoteId,
    DateTime QuoteDate,
    int ProductTypeId,
    string? ProductTypeDescription
);

public sealed record CommercialQuotedNotBoughtResponseDto(
    CommercialAppliedFiltersDto Filters,
    CommercialFilterSupportDto SupportedFilters,
    IReadOnlyList<string> UnsupportedFilters,
    int TotalCount,
    int Offset,
    int Take,
    IReadOnlyList<CommercialQuotedNotBoughtDto> Items
);

public sealed record CommercialDashboardResponseDto(
    CommercialSummaryResponseDto Summary,
    CommercialTopProductsResponseDto TopProducts,
    CommercialClientsWithoutPoliciesResponseDto ClientsWithoutPolicies,
    CommercialQuotedNotBoughtResponseDto QuotedNotBought
);

public sealed record CommercialPlanBreakdownDto(
    int PlanId,
    string PlanName,
    int PoliciesSold,
    int UniqueClients,
    decimal TotalPremium
);

public sealed record CommercialDimensionBreakdownDto(
    string Label,
    int Value,
    int PoliciesSold,
    int UniqueClients,
    decimal TotalPremium
);

public sealed record CommercialProductDetailResponseDto(
    CommercialAppliedFiltersDto Filters,
    int ProductId,
    string ProductName,
    int ProductTypeId,
    int PoliciesSold,
    int UniqueClients,
    decimal TotalPremium,
    DateTime? LastPolicyDate,
    IReadOnlyList<CommercialPlanBreakdownDto> Plans,
    IReadOnlyList<CommercialDimensionBreakdownDto> Branches,
    IReadOnlyList<CommercialDimensionBreakdownDto> Channels,
    IReadOnlyList<CommercialDimensionBreakdownDto> Sellers
);

public sealed record CommercialClientQuoteSummaryDto(
    int QuoteId,
    DateTime QuoteDate,
    int ProductTypeId,
    string? ProductTypeDescription
);

public sealed record CommercialClientPolicySummaryDto(
    long PolicyId,
    DateTime? PolicyDate,
    string? PolicyStatus,
    int? ProductId,
    string? ProductName,
    int? PlanId,
    string? PlanName
);

public sealed record CommercialClientDetailResponseDto(
    long ClientId,
    string DisplayName,
    string? DocumentNumber,
    string? Email,
    int TotalQuotes,
    DateTime? LastQuoteDate,
    int TotalPolicies,
    DateTime? LastPolicyDate,
    bool HasAnyPolicy,
    bool HasQuotesWithoutPurchase,
    IReadOnlyList<CommercialClientQuoteSummaryDto> RecentQuotes,
    IReadOnlyList<CommercialClientPolicySummaryDto> RecentPolicies
);
