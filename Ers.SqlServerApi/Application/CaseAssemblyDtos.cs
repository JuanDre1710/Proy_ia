namespace Ers.SqlServerApi.Application;

public sealed record BuildCaseFromClaimRequestDto(
    string ClaimId
);

public sealed record CasePersonDto(
    string PersonId,
    string DisplayName,
    string? DocumentNumber,
    string? TaxId,
    string? Email
);

public sealed record CasePolicyDto(
    string? PolicyNumber,
    string? CertificateNumber,
    string? PolicyStatus,
    string? LinkStatus,
    DateTime? PolicyCreatedAt,
    decimal? PolicyPremium
);

public sealed record CaseClaimDto(
    string ClaimId,
    string ClaimNumber,
    DateTime? ClaimDate,
    string StatusCode,
    string? ClaimType,
    decimal? ClaimAmount,
    decimal? ClaimedAmount
);

public sealed record HistoricalClaimDto(
    string ClaimId,
    string ClaimNumber,
    DateTime? ClaimDate,
    string StatusCode,
    string? ClaimType,
    decimal? ClaimAmount,
    decimal? ClaimedAmount,
    string? PolicyNumber,
    string? CertificateNumber
);

public sealed record CaseHistoricalFeaturesDto(
    int TotalClaims,
    int ClaimsLast365Days,
    decimal AverageHistoricalAmount,
    int? DaysSincePreviousClaim,
    int? DaysBetweenPolicyCreationAndClaim
);

public sealed record CaseModelDto(
    string CaseKey,
    CasePersonDto Person,
    CasePolicyDto Policy,
    CaseClaimDto SelectedClaim,
    IReadOnlyList<HistoricalClaimDto> ClaimHistory,
    CaseHistoricalFeaturesDto HistoricalFeatures,
    string Message
);
