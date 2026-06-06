using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Queries;

[Keyless]
public sealed class ClaimSelectionLookupRow
{
    public int ClaimId { get; set; }
    public int PersonId { get; set; }
    public string? ClaimNumber { get; set; }
    public DateTime? OccurredAt { get; set; }
    public string? StatusCode { get; set; }
    public string? StatusLabel { get; set; }
    public decimal? ClaimAmount { get; set; }
    public decimal? ClaimedAmount { get; set; }
    public string? ClaimTypeId { get; set; }
    public string? PolicyNumber { get; set; }
    public string? CertificateNumber { get; set; }
    public string? PolicyStatus { get; set; }
    public string? LinkStatus { get; set; }
    public DateTime? PolicyCreatedAt { get; set; }
    public decimal? PolicyPremium { get; set; }
}
