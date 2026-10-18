using System;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.Entities;

public class Enrollment : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ClassId { get; set; }
    public Guid StudentId { get; set; }
    public TuitionStatus TuitionStatus { get; set; } = TuitionStatus.Unpaid;
    public DateTimeOffset EnrolledAt { get; set; } = DateTimeOffset.UtcNow;

    public Class Class { get; set; } = null!;
    public User Student { get; set; } = null!;
}
