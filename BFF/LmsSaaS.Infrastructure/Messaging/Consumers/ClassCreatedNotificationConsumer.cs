using System;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Core.Events;
using LmsSaaS.Infrastructure.Persistence;
using MassTransit;

namespace LmsSaaS.Infrastructure.Messaging.Consumers;

public class ClassCreatedNotificationConsumer(
    AppDbContext dbContext,
    ICurrentTenantService currentTenantService) : IConsumer<ClassCreatedIntegrationEvent>
{
    public async Task Consume(ConsumeContext<ClassCreatedIntegrationEvent> context)
    {
        var msg = context.Message;

        // 1. Khôi phục ngữ cảnh Tenant cho Scoped Service trong Background Thread
        currentTenantService.SetTenantContext(msg.TenantId, msg.TenantSlug);

        // 2. Tạo bản ghi thông báo phân công giảng dạy cho giáo viên
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            TenantId = msg.TenantId,
            RecipientUserId = msg.TeacherId,
            Title = "Phân công giảng dạy lớp mới",
            Message = $"Bạn đã được phân công phụ trách giảng dạy lớp {msg.ClassName} thuộc khóa học {msg.CourseTitle} (Khai giảng: {msg.StartDate:dd/MM/yyyy}, Tổng số: {msg.TotalSessions} buổi).",
            Type = NotificationType.ClassAssigned,
            ActionUrl = $"/{msg.TenantSlug}/classes",
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(context.CancellationToken);
    }
}

