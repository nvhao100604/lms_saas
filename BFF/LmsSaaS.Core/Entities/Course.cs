using System;
using System.Collections.Generic;
using LmsSaaS.Core.Common;

namespace LmsSaaS.Core.Entities;

public class Course : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal TuitionFee { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public ICollection<Class> Classes { get; set; } = new List<Class>();
}
