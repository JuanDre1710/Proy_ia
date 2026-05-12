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
    string? Email,
    DateTime? BirthDate,
    string? Address,
    string? Locality,
    string? Province
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
    DateTime? BirthDate,
    string? AddressStreet,
    string? AddressNumber,
    string? PostalCode,
    string? Locality,
    string? Province,
    string? PersonType,
    string? Gender,
    string? CivilStatus,
    string? Activity,
    string? ClientStatus,
    string? PepFlag,
    string? ProposalNumber,
    string? PolicyStatus,
    string? LinkStatus,
    DateTime? PolicyCreatedAt,
    decimal? PolicyPremium,
    DateTime? ValidityStartAt,
    DateTime? ValidityEndAt,
    string? ValidityStatus,
    decimal? CalculatedPremium,
    string? ClaimContact,
    string? ClaimPhone,
    string? ClaimCbu,
    string? ClaimEntryChannelId,
    string? ClaimOccurrenceAddress,
    string? PolicyClaimLinkId,
    string? PolicyValidityId
);

public sealed record IncrementalClaimRecord(
    string ClaimId,
    DateTime AuditDate,
    DateTime? LoadDate
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

public interface IIncrementalClaimProvider
{
    Task<IReadOnlyList<IncrementalClaimRecord>> ListIncrementalClaimsAsync(
        DateTime cursorDate,
        long cursorClaimId,
        DateTime readFromDate,
        int batchSize,
        CancellationToken cancellationToken = default);
}
