namespace Ers.SqlServerAdapter.Contracts;

public sealed record IdentitySearchQuery(
    string Identifier,
    string IdentifierType,
    string? DocumentTypeHint = null
);

public sealed record PersonIdentityRecord(
    string PersonId,
    string IdentifierValue,
    string IdentifierType,
    string? DocumentType,
    string? DocumentNumber,
    string? TaxId,
    string DisplayName,
    string? Email
);

public sealed record ClaimSelectionRecord(
    string ClaimId,
    string PersonId,
    string ClaimNumber,
    DateTime? OccurredAt,
    string StatusCode,
    string StatusLabel,
    decimal? ClaimAmount,
    decimal? ClaimedAmount,
    string? ClaimTypeId,
    string? PolicyNumber,
    string? CertificateNumber,
    string? PolicyStatus,
    string? LinkStatus,
    DateTime? PolicyCreatedAt,
    decimal? PolicyPremium
);

public sealed record ClaimCaseRecord(
    string ClaimId,
    string PersonId,
    string ClaimNumber,
    string? PolicyNumber,
    string? CertificateNumber,
    string StatusCode,
    string? ClaimTypeId,
    DateTime? OccurredAt,
    decimal? ClaimAmount,
    decimal? ClaimedAmount,
    string PersonDisplayName,
    string? DocumentNumber,
    string? TaxId,
    string? Email,
    string? PolicyStatus,
    string? LinkStatus,
    DateTime? PolicyCreatedAt,
    decimal? PolicyPremium
);

public interface IPersonSearchProvider
{
    Task<PersonIdentityRecord?> SearchPersonAsync(IdentitySearchQuery query, CancellationToken cancellationToken = default);
}

public interface IClaimQueryProvider
{
    Task<IReadOnlyList<ClaimSelectionRecord>> ListClaimsByPersonAsync(string personId, CancellationToken cancellationToken = default);
}

public interface ICaseDataProvider
{
    Task<ClaimCaseRecord?> GetClaimCaseDataAsync(string claimId, CancellationToken cancellationToken = default);
}
