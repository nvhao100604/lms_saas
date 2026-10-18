using System;

namespace LmsSaaS.Core.Common;

public interface ICurrentTenantService
{
    Guid? TenantId { get; }
    string? TenantSlug { get; }
    Guid? UserId { get; }
    string? Role { get; }

    void SetTenantContext(Guid tenantId, string tenantSlug, Guid? userId = null, string? role = null);
}
