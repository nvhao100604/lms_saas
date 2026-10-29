using System;

namespace LmsSaaS.Core.DTOs.Notifications;

public record NotificationResponse(
    Guid Id,
    string Title,
    string Message,
    string Type,
    string? ActionUrl,
    bool IsRead,
    DateTimeOffset CreatedAt
);

