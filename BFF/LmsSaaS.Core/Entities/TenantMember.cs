using System;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.Entities;

public class TenantMember : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public RoleInTenant Role { get; set; } = RoleInTenant.Student;
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public User User { get; set; } = null!;
}
