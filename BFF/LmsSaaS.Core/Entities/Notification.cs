using System;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.Entities;

public class Notification : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid RecipientUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string? ActionUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public User RecipientUser { get; set; } = null!;
}

