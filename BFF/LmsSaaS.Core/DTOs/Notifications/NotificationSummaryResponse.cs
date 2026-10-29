using System.Collections.Generic;

namespace LmsSaaS.Core.DTOs.Notifications;

public record NotificationSummaryResponse(
    int UnreadCount,
    IReadOnlyList<NotificationResponse> Items
);

