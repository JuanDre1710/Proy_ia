namespace Ers.SqlServerApi.Application;

public sealed record CaseModel(
    string CaseKey,
    CasePerson Person,
    CasePolicy Policy,
    CaseClaim SelectedClaim,
    IReadOnlyList<HistoricalClaim> ClaimHistory,
    CaseHistoricalFeatures HistoricalFeatures
);

public sealed record CasePerson(
    string PersonId,
    string DisplayName,
    string? DocumentNumber,
    string? TaxId,
    string? Email
);

public sealed record CasePolicy(
    string? PolicyNumber,
    string? CertificateNumber,
    string? PolicyStatus,
    string? LinkStatus,
    DateTime? PolicyCreatedAt,
    decimal? PolicyPremium
);

public sealed record CaseClaim(
    string ClaimId,
    string ClaimNumber,
    DateTime? ClaimDate,
    string StatusCode,
    string? ClaimType,
    decimal? ClaimAmount,
    decimal? ClaimedAmount
);

public sealed record HistoricalClaim(
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

public sealed record CaseHistoricalFeatures(
    int TotalClaims,
    int ClaimsLast365Days,
    decimal AverageHistoricalAmount,
    int? DaysSincePreviousClaim,
    int? DaysBetweenPolicyCreationAndClaim
);
