using System;

namespace LmsSaaS.Core.Common;

public interface IJwtService
{
    string GenerateTenantToken(Guid userId, string email, Guid tenantId, string tenantSlug, string roleInTenant);
    string GenerateRefreshToken();
}
