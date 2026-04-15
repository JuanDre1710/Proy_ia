using Microsoft.EntityFrameworkCore;

namespace Ers.SqlServerAdapter.Infrastructure.Persistence.Queries;

[Keyless]
public sealed class IncrementalClaimRow
{
    public long ClaimId { get; set; }
    public DateTime AuditDate { get; set; }
    public DateTime? LoadDate { get; set; }
}
