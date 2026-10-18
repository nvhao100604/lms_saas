using System;
using LmsSaaS.Core.Common;

namespace LmsSaaS.Infrastructure.Services;

public class CurrentTenantService : ICurrentTenantService
{
    public Guid? TenantId { get; private set; }
    public string? TenantSlug { get; private set; }
    public Guid? UserId { get; private set; }
    public string? Role { get; private set; }

    public void SetTenantContext(Guid tenantId, string tenantSlug, Guid? userId = null, string? role = null)
    {
        TenantId = tenantId;
        TenantSlug = tenantSlug;
        UserId = userId;
        Role = role;
    }
}
