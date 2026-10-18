using System;

namespace LmsSaaS.Core.Common;

public interface ITenantEntity
{
    Guid TenantId { get; set; }
}
