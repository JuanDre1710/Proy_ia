namespace Ers.SqlServerApi.Application;

public sealed record BuildCaseFromClaimRequestDto(
    string ClaimId
);

public sealed record CasePersonDto(
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

public sealed record CaseAddressDto(
    string? Street,
    string? Number,
    string? PostalCode,
    string? Locality,
    string? Province
);

public sealed record CasePolicyDto(
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

public sealed record CaseClaimDto(
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

public sealed record CaseTraceabilityDto(
    string PersonId,
    string ClaimId,
    string? PolicyClaimLinkId,
    string? PolicyValidityId,
    string? ProposalNumber
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
    CaseAddressDto ActiveAddress,
    CasePolicyDto Policy,
    CaseClaimDto SelectedClaim,
    CaseTraceabilityDto Traceability,
    IReadOnlyList<HistoricalClaimDto> ClaimHistory,
    CaseHistoricalFeaturesDto HistoricalFeatures,
    string Message
);
