namespace Ers.SqlServerApi.Application;

public sealed record CaseModel(
    string CaseKey,
    CasePerson Person,
    CaseAddress ActiveAddress,
    CasePolicy Policy,
    CaseClaim SelectedClaim,
    CaseTraceability Traceability,
    IReadOnlyList<HistoricalClaim> ClaimHistory,
    CaseHistoricalFeatures HistoricalFeatures
);

public sealed record CasePerson(
    string PersonId,
    string DisplayName,
    string? DocumentNumber,
    string? TaxId,
    string? Email,
    DateTime? BirthDate,
    string? PersonType,
    string? Gender,
    string? CivilStatus,
    string? Activity,
    string? ClientStatus,
    string? PepFlag
);

public sealed record CaseAddress(
    string? Street,
    string? Number,
    string? PostalCode,
    string? Locality,
    string? Province
);

public sealed record CasePolicy(
    string? PolicyNumber,
    string? CertificateNumber,
    string? ProposalNumber,
    string? PolicyStatus,
    string? LinkStatus,
    DateTime? PolicyCreatedAt,
    decimal? PolicyPremium,
    DateTime? ValidityStartAt,
    DateTime? ValidityEndAt,
    string? ValidityStatus,
    decimal? CalculatedPremium
);

public sealed record CaseClaim(
    string ClaimId,
    string ClaimNumber,
    DateTime? ClaimDate,
    string StatusCode,
    string? ClaimType,
    decimal? ClaimAmount,
    decimal? ClaimedAmount,
    string? ContactName,
    string? ContactPhone,
    string? ContactCbu,
    string? EntryChannelId,
    string? OccurrenceAddress
);

public sealed record CaseTraceability(
    string PersonId,
    string ClaimId,
    string? PolicyClaimLinkId,
    string? PolicyValidityId,
    string? ProposalNumber
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
