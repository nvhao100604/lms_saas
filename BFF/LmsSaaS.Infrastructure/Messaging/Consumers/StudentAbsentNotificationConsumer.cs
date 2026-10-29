using System;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Core.Events;
using LmsSaaS.Infrastructure.Persistence;
using MassTransit;

namespace LmsSaaS.Infrastructure.Messaging.Consumers;

public class StudentAbsentNotificationConsumer(
    AppDbContext dbContext,
    ICurrentTenantService currentTenantService) : IConsumer<StudentAbsentIntegrationEvent>
{
    public async Task Consume(ConsumeContext<StudentAbsentIntegrationEvent> context)
    {
        var msg = context.Message;

        // 1. Khôi phục ngữ cảnh Tenant cho Scoped Service trong Background Thread
        currentTenantService.SetTenantContext(msg.TenantId, msg.TenantSlug);

        // 2. Tạo bản ghi thông báo cảnh báo vắng mặt cho học viên
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            TenantId = msg.TenantId,
            RecipientUserId = msg.StudentId,
            Title = "Cảnh báo vắng mặt buổi học",
            Message = $"Bạn đã vắng mặt trong buổi học số {msg.SessionNumber} của lớp {msg.ClassName} vào ngày {msg.SessionDate:dd/MM/yyyy}. Vui lòng liên hệ giảng viên hoặc xem lại tài liệu buổi học.",
            Type = NotificationType.AttendanceAbsent,
            ActionUrl = $"/{msg.TenantSlug}/schedule",
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(context.CancellationToken);
    }
}

