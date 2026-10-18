using System;

namespace LmsSaaS.Core.Common;

public class SelectTenantRequest
{
    public Guid UserId { get; set; }
    public string TenantSlug { get; set; } = string.Empty;
}
