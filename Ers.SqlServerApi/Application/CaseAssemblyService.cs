using Ers.SqlServerAdapter.Contracts;

namespace Ers.SqlServerApi.Application;

public sealed class CaseAssemblyService
{
    private readonly ICaseDataProvider _caseDataProvider;
    private readonly IClaimQueryProvider _claimQueryProvider;

    public CaseAssemblyService(
        ICaseDataProvider caseDataProvider,
        IClaimQueryProvider claimQueryProvider)
    {
        _caseDataProvider = caseDataProvider;
        _claimQueryProvider = claimQueryProvider;
    }

    public async Task<CaseModel?> BuildDomainModelAsync(
        BuildCaseFromClaimRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var selectedClaim = await _caseDataProvider.GetClaimCaseDataAsync(request.ClaimId.Trim(), cancellationToken);
        if (selectedClaim is null)
        {
            return null;
        }

        var historicalClaims = await _claimQueryProvider.ListClaimsByPersonAsync(selectedClaim.PersonId, cancellationToken);

        return BuildCaseModel(selectedClaim, historicalClaims);
    }

    public async Task<CaseModelDto?> BuildFromClaimAsync(
        BuildCaseFromClaimRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var domainModel = await BuildDomainModelAsync(request, cancellationToken);
        return domainModel is null ? null : MapToDto(domainModel);
    }

    private static CaseModel BuildCaseModel(
        ClaimCaseRecord selectedClaim,
        IReadOnlyList<ClaimSelectionRecord> allClaims)
    {
        var selectedClaimDate = selectedClaim.OccurredAt;
        var orderedHistory = allClaims
            .OrderByDescending(item => item.OccurredAt)
            .ThenByDescending(item => item.ClaimId)
            .Select(item => new HistoricalClaim(
                item.ClaimId,
                item.ClaimNumber,
                item.OccurredAt,
                item.StatusCode,
                item.ClaimTypeId,
                item.ClaimAmount,
                item.ClaimedAmount,
                item.PolicyNumber,
                item.CertificateNumber
            ))
            .ToList();

        var previousClaimDate = allClaims
            .Where(item => item.ClaimId != selectedClaim.ClaimId && item.OccurredAt.HasValue && selectedClaimDate.HasValue)
            .Where(item => item.OccurredAt < selectedClaimDate)
            .OrderByDescending(item => item.OccurredAt)
            .Select(item => item.OccurredAt)
            .FirstOrDefault();

        var claimsLast365Days = selectedClaimDate.HasValue
            ? allClaims.Count(item =>
                item.OccurredAt.HasValue &&
                item.OccurredAt.Value >= selectedClaimDate.Value.AddDays(-365) &&
                item.OccurredAt.Value <= selectedClaimDate.Value)
            : allClaims.Count;

        var averageHistoricalAmount = allClaims
            .Select(item => item.ClaimedAmount ?? item.ClaimAmount)
            .Where(amount => amount.HasValue)
            .Select(amount => amount!.Value)
            .DefaultIfEmpty(0m)
            .Average();

        var daysSincePreviousClaim = selectedClaimDate.HasValue && previousClaimDate.HasValue
            ? (int?)(selectedClaimDate.Value.Date - previousClaimDate.Value.Date).TotalDays
            : null;

        var daysBetweenPolicyCreationAndClaim = selectedClaimDate.HasValue && selectedClaim.PolicyCreatedAt.HasValue
            ? (int?)(selectedClaimDate.Value.Date - selectedClaim.PolicyCreatedAt.Value.Date).TotalDays
            : null;

        return new CaseModel(
            $"CASE-{selectedClaim.ClaimId}",
            new CasePerson(
                selectedClaim.PersonId,
                selectedClaim.PersonDisplayName,
                selectedClaim.DocumentNumber,
                selectedClaim.TaxId,
                selectedClaim.Email,
                selectedClaim.BirthDate,
                selectedClaim.PersonType,
                selectedClaim.Gender,
                selectedClaim.CivilStatus,
                selectedClaim.Activity,
                selectedClaim.ClientStatus,
                selectedClaim.PepFlag
            ),
            new CaseAddress(
                selectedClaim.AddressStreet,
                selectedClaim.AddressNumber,
                selectedClaim.PostalCode,
                selectedClaim.Locality,
                selectedClaim.Province
            ),
            new CasePolicy(
                selectedClaim.PolicyNumber,
                selectedClaim.CertificateNumber,
                selectedClaim.ProposalNumber,
                selectedClaim.PolicyStatus,
                selectedClaim.LinkStatus,
                selectedClaim.PolicyCreatedAt,
                selectedClaim.PolicyPremium,
                selectedClaim.ValidityStartAt,
                selectedClaim.ValidityEndAt,
                selectedClaim.ValidityStatus,
                selectedClaim.CalculatedPremium
            ),
            new CaseClaim(
                selectedClaim.ClaimId,
                selectedClaim.ClaimNumber,
                selectedClaim.OccurredAt,
                selectedClaim.StatusCode,
                selectedClaim.ClaimTypeId,
                selectedClaim.ClaimAmount,
                selectedClaim.ClaimedAmount,
                selectedClaim.ClaimContact,
                selectedClaim.ClaimPhone,
                selectedClaim.ClaimCbu,
                selectedClaim.ClaimEntryChannelId,
                selectedClaim.ClaimOccurrenceAddress
            ),
            new CaseTraceability(
                selectedClaim.PersonId,
                selectedClaim.ClaimId,
                selectedClaim.PolicyClaimLinkId,
                selectedClaim.PolicyValidityId,
                selectedClaim.ProposalNumber
            ),
            orderedHistory,
            new CaseHistoricalFeatures(
                allClaims.Count,
                claimsLast365Days,
                decimal.Round(averageHistoricalAmount, 2, MidpointRounding.AwayFromZero),
                daysSincePreviousClaim,
                daysBetweenPolicyCreationAndClaim
            )
        );
    }

    private static CaseModelDto MapToDto(CaseModel model)
    {
        return new CaseModelDto(
            model.CaseKey,
            new CasePersonDto(
                model.Person.PersonId,
                model.Person.DisplayName,
                model.Person.DocumentNumber,
                model.Person.TaxId,
                model.Person.Email,
                model.Person.BirthDate,
                model.Person.PersonType,
                model.Person.Gender,
                model.Person.CivilStatus,
                model.Person.Activity,
                model.Person.ClientStatus,
                model.Person.PepFlag
            ),
            new CaseAddressDto(
                model.ActiveAddress.Street,
                model.ActiveAddress.Number,
                model.ActiveAddress.PostalCode,
                model.ActiveAddress.Locality,
                model.ActiveAddress.Province
            ),
            new CasePolicyDto(
                model.Policy.PolicyNumber,
                model.Policy.CertificateNumber,
                model.Policy.ProposalNumber,
                model.Policy.PolicyStatus,
                model.Policy.LinkStatus,
                model.Policy.PolicyCreatedAt,
                model.Policy.PolicyPremium,
                model.Policy.ValidityStartAt,
                model.Policy.ValidityEndAt,
                model.Policy.ValidityStatus,
                model.Policy.CalculatedPremium
            ),
            new CaseClaimDto(
                model.SelectedClaim.ClaimId,
                model.SelectedClaim.ClaimNumber,
                model.SelectedClaim.ClaimDate,
                model.SelectedClaim.StatusCode,
                model.SelectedClaim.ClaimType,
                model.SelectedClaim.ClaimAmount,
                model.SelectedClaim.ClaimedAmount,
                model.SelectedClaim.ContactName,
                model.SelectedClaim.ContactPhone,
                model.SelectedClaim.ContactCbu,
                model.SelectedClaim.EntryChannelId,
                model.SelectedClaim.OccurrenceAddress
            ),
            new CaseTraceabilityDto(
                model.Traceability.PersonId,
                model.Traceability.ClaimId,
                model.Traceability.PolicyClaimLinkId,
                model.Traceability.PolicyValidityId,
                model.Traceability.ProposalNumber
            ),
            model.ClaimHistory
                .Select(item => new HistoricalClaimDto(
                    item.ClaimId,
                    item.ClaimNumber,
                    item.ClaimDate,
                    item.StatusCode,
                    item.ClaimType,
                    item.ClaimAmount,
                    item.ClaimedAmount,
                    item.PolicyNumber,
                    item.CertificateNumber
                ))
                .ToList(),
            new CaseHistoricalFeaturesDto(
                model.HistoricalFeatures.TotalClaims,
                model.HistoricalFeatures.ClaimsLast365Days,
                model.HistoricalFeatures.AverageHistoricalAmount,
                model.HistoricalFeatures.DaysSincePreviousClaim,
                model.HistoricalFeatures.DaysBetweenPolicyCreationAndClaim
            ),
            "Caso interno construido desde el siniestro seleccionado. Listo para reglas, reasoning y scoring en sprints posteriores."
        );
    }
}
