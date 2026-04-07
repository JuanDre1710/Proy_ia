namespace Ers.SqlServerApi.Application;

public sealed record IdentitySearchRequestDto(
    string Document,
    string? DocumentType
);

public sealed record PersonSearchDto(
    string PersonId,
    string IdentifierValue,
    string IdentifierType,
    string? DocumentType,
    string? DocumentNumber,
    string? TaxId,
    string DisplayName,
    string? Email,
    DateTime? BirthDate,
    string? Address,
    string? Locality,
    string? Province
);

public sealed record PolicySummaryDto(
    string? PolicyNumber,
    string? CertificateNumber,
    string? PolicyStatus,
    string? LinkStatus,
    DateTime? PolicyCreatedAt,
    decimal? PolicyPremium
);

public sealed record ClaimSummaryDto(
    string ClaimId,
    string ClaimNumber,
    DateTime? ClaimDate,
    string StatusCode,
    string StatusLabel,
    string? ClaimType,
    decimal? ClaimAmount,
    decimal? ClaimedAmount,
    string? PolicyNumber,
    string? CertificateNumber
);

public sealed record IdentitySearchResponseDto(
    string SearchStatus,
    PersonSearchDto? Person,
    IReadOnlyList<PolicySummaryDto> Policies,
    IReadOnlyList<ClaimSummaryDto> Claims,
    int TotalPolicies,
    int TotalClaims,
    bool HasSingleClaim,
    bool RequiresClaimSelection,
    string Message
);
