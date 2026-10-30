namespace LmsSaaS.Core.DTOs.Dashboard;

public record SubscriptionQuotaResponse(
    string PlanName,
    decimal MonthlyPrice,
    int CurrentClassesCount,
    int MaxClassesLimit,
    int CurrentStudentsCount,
    int MaxStudentsLimit
);
