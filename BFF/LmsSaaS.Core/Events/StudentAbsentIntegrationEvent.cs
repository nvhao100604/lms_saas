using System;

namespace LmsSaaS.Core.Events;

public record StudentAbsentIntegrationEvent(
    Guid TenantId,
    string TenantSlug,
    Guid ClassId,
    string ClassName,
    Guid SessionId,
    int SessionNumber,
    Guid StudentId,
    DateTimeOffset SessionDate
);

