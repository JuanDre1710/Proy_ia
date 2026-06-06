using Ers.SqlServerAdapter.Contracts;

namespace Ers.SqlServerApi.Application;

public sealed class IdentitySearchService
{
    private readonly IPersonSearchProvider _personSearchProvider;
    private readonly IClaimQueryProvider _claimQueryProvider;

    public IdentitySearchService(
        IPersonSearchProvider personSearchProvider,
        IClaimQueryProvider claimQueryProvider)
    {
        _personSearchProvider = personSearchProvider;
        _claimQueryProvider = claimQueryProvider;
    }

    public async Task<IdentitySearchResponseDto> SearchAsync(
        IdentitySearchRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var query = new IdentitySearchQuery(
            request.Document.Trim(),
            InferIdentifierType(request.Document),
            request.DocumentType?.Trim()
        );

        var person = await _personSearchProvider.SearchPersonAsync(query, cancellationToken);
        if (person is null)
        {
            return new IdentitySearchResponseDto(
                "not_found",
                null,
                [],
                [],
                0,
                0,
                false,
                false,
                "No se encontro una persona asociada a la identidad consultada."
            );
        }

        var claims = await _claimQueryProvider.ListClaimsByPersonAsync(person.PersonId, cancellationToken);

        var claimDtos = claims
            .Select(claim => new ClaimSummaryDto(
                claim.ClaimId,
                claim.ClaimNumber,
                claim.OccurredAt,
                claim.StatusCode,
                claim.StatusLabel,
                claim.ClaimTypeId,
                claim.ClaimAmount,
                claim.ClaimedAmount,
                claim.PolicyNumber,
                claim.CertificateNumber
            ))
            .ToList();

        var policyDtos = claims
            .Where(claim => !string.IsNullOrWhiteSpace(claim.PolicyNumber) || !string.IsNullOrWhiteSpace(claim.CertificateNumber))
            .Select(claim => new PolicySummaryDto(
                claim.PolicyNumber,
                claim.CertificateNumber,
                claim.PolicyStatus,
                claim.LinkStatus,
                claim.PolicyCreatedAt,
                claim.PolicyPremium
            ))
            .Distinct()
            .ToList();

        var searchStatus = claims.Count switch
        {
            0 => "person_without_claims",
            1 => "single_claim",
            _ => "multiple_claims"
        };

        return new IdentitySearchResponseDto(
            searchStatus,
            new PersonSearchDto(
                person.PersonId,
                person.IdentifierValue,
                person.IdentifierType,
                person.DocumentType,
                person.DocumentNumber,
                person.TaxId,
                person.DisplayName,
                person.Email,
                person.BirthDate,
                person.Address,
                person.Locality,
                person.Province
            ),
            policyDtos,
            claimDtos,
            policyDtos.Count,
            claimDtos.Count,
            claimDtos.Count == 1,
            claimDtos.Count > 1,
            BuildMessage(searchStatus, person.DisplayName, claimDtos.Count)
        );
    }

    private static string InferIdentifierType(string rawValue)
    {
        var normalized = rawValue.Trim();
        if (normalized.Length == 11)
        {
            return "CUIT";
        }

        return "DNI";
    }

    private static string BuildMessage(string searchStatus, string displayName, int totalClaims)
    {
        return searchStatus switch
        {
            "person_without_claims" => $"{displayName} fue encontrado/a, pero no registra siniestros asociados.",
            "single_claim" => $"{displayName} fue encontrado/a con 1 siniestro asociado.",
            "multiple_claims" => $"{displayName} fue encontrado/a con {totalClaims} siniestros asociados.",
            _ => "Busqueda resuelta."
        };
    }
}
