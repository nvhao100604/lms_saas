using System;

namespace LmsSaaS.Core.Events;

public record ClassCreatedIntegrationEvent(
    Guid TenantId,
    string TenantSlug,
    Guid ClassId,
    string ClassName,
    string CourseTitle,
    Guid TeacherId,
    DateOnly StartDate,
    int TotalSessions
);

