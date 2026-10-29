using System;
using System.Collections.Generic;

namespace LmsSaaS.Core.Entities;

public class SubscriptionPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; } = 0m;
    public int MaxClassesLimit { get; set; }
    public int MaxStudentsPerClass { get; set; }
    public int MaxStudentsLimit { get; set; } = 100;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();
}
