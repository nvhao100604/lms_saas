using System.Collections.Generic;

namespace LmsSaaS.Core.DTOs.Dashboard;

public record DashboardSummaryResponse(
    int TotalActiveCourses,
    int TotalOngoingClasses,
    int TotalActiveTeachers,
    int TotalActiveStudents,
    double AttendanceRatePercent,
    SubscriptionQuotaResponse Quota,
    IReadOnlyList<TodaySessionItemResponse> TodaySessions
);
