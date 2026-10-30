using System;

namespace LmsSaaS.Core.DTOs.Dashboard;

public record SubscriptionPlanItemResponse(
    Guid Id,
    string Name,
    decimal MonthlyPrice,
    int MaxClassesLimit,
    int MaxStudentsLimit,
    bool IsCurrentPlan
);

