using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using LmsSaaS.Api.Controllers;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Notifications;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Core.Events;
using LmsSaaS.Infrastructure.Messaging.Consumers;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using MassTransit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class NotificationSystemTests
{
    private static (AppDbContext context, CurrentTenantService tenantService) CreateTestContext()
    {
        var tenantService = new CurrentTenantService();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options, tenantService);
        return (context, tenantService);
    }

    [Fact]
    public async Task ClassCreatedNotificationConsumer_ShouldPersistNotification_WithCorrectTenantAndRecipient()
    {
        // Arrange
        var (context, tenantService) = CreateTestContext();
        await using (context)
        {
            var consumer = new ClassCreatedNotificationConsumer(context, tenantService);
            var tenantId = Guid.NewGuid();
            var teacherId = Guid.NewGuid();
            var message = new ClassCreatedIntegrationEvent(
                tenantId,
                "apex-center",
                Guid.NewGuid(),
                "IELTS Master 01",
                "Khóa học IELTS Nâng cao",
                teacherId,
                new DateOnly(2026, 11, 15),
                24
            );

            var consumeContext = Substitute.For<ConsumeContext<ClassCreatedIntegrationEvent>>();
            consumeContext.Message.Returns(message);
            consumeContext.CancellationToken.Returns(CancellationToken.None);

            // Act
            await consumer.Consume(consumeContext);

            // Assert
            Assert.Equal(tenantId, tenantService.TenantId);
            Assert.Equal("apex-center", tenantService.TenantSlug);

            var notification = await context.Notifications
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(n => n.RecipientUserId == teacherId);

            Assert.NotNull(notification);
            Assert.Equal(tenantId, notification.TenantId);
            Assert.Equal(teacherId, notification.RecipientUserId);
            Assert.Equal(NotificationType.ClassAssigned, notification.Type);
            Assert.Equal("/apex-center/classes", notification.ActionUrl);
            Assert.False(notification.IsRead);
            Assert.Contains("Phân công giảng dạy", notification.Title);
            Assert.Contains("IELTS Master 01", notification.Message);
            Assert.Contains("24 buổi", notification.Message);
        }
    }

    [Fact]
    public async Task StudentAbsentNotificationConsumer_ShouldPersistNotification_WithCorrectTenantAndRecipient()
    {
        // Arrange
        var (context, tenantService) = CreateTestContext();
        await using (context)
        {
            var consumer = new StudentAbsentNotificationConsumer(context, tenantService);
            var tenantId = Guid.NewGuid();
            var studentId = Guid.NewGuid();
            var sessionDate = DateTimeOffset.UtcNow;
            var message = new StudentAbsentIntegrationEvent(
                tenantId,
                "apex-center",
                Guid.NewGuid(),
                "TOEIC 500+",
                Guid.NewGuid(),
                3,
                studentId,
                sessionDate
            );

            var consumeContext = Substitute.For<ConsumeContext<StudentAbsentIntegrationEvent>>();
            consumeContext.Message.Returns(message);
            consumeContext.CancellationToken.Returns(CancellationToken.None);

            // Act
            await consumer.Consume(consumeContext);

            // Assert
            Assert.Equal(tenantId, tenantService.TenantId);
            Assert.Equal("apex-center", tenantService.TenantSlug);

            var notification = await context.Notifications
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(n => n.RecipientUserId == studentId);

            Assert.NotNull(notification);
            Assert.Equal(tenantId, notification.TenantId);
            Assert.Equal(studentId, notification.RecipientUserId);
            Assert.Equal(NotificationType.AttendanceAbsent, notification.Type);
            Assert.Equal("/apex-center/schedule", notification.ActionUrl);
            Assert.False(notification.IsRead);
            Assert.Contains("Cảnh báo vắng mặt", notification.Title);
            Assert.Contains("buổi học số 3", notification.Message);
            Assert.Contains("TOEIC 500+", notification.Message);
        }
    }

    [Fact]
    public async Task NotificationsController_GetNotifications_ShouldIsolateBetweenUsersAndTenants()
    {
        // Arrange
        var (context, tenantService) = CreateTestContext();
        await using (context)
        {
            var tenant1Id = Guid.NewGuid();
            var tenant2Id = Guid.NewGuid();
            var userAId = Guid.NewGuid();
            var userBId = Guid.NewGuid();

            // Seed notifications
            var notifUserATenant1Unread = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenant1Id,
                RecipientUserId = userAId,
                Title = "User A Unread",
                Message = "Msg 1",
                Type = NotificationType.SystemAlert,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-10)
            };
            var notifUserATenant1Read = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenant1Id,
                RecipientUserId = userAId,
                Title = "User A Read",
                Message = "Msg 2",
                Type = NotificationType.SystemAlert,
                IsRead = true,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-20)
            };
            var notifUserBTenant1 = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenant1Id,
                RecipientUserId = userBId,
                Title = "User B Tenant 1",
                Message = "Msg 3",
                Type = NotificationType.SystemAlert,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5)
            };
            var notifUserATenant2 = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenant2Id,
                RecipientUserId = userAId,
                Title = "User A Tenant 2",
                Message = "Msg 4",
                Type = NotificationType.SystemAlert,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-1)
            };

            context.Notifications.AddRange(
                notifUserATenant1Unread,
                notifUserATenant1Read,
                notifUserBTenant1,
                notifUserATenant2
            );
            await context.SaveChangesAsync();

            // Thiết lập ngữ cảnh: User A tại Tenant 1
            tenantService.SetTenantContext(tenant1Id, "tenant-1", userAId, "Student");

            var controller = new NotificationsController(context, tenantService);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userAId.ToString()),
                        new Claim("tenant_id", tenant1Id.ToString())
                    }, "TestAuth"))
                }
            };

            // Act
            var actionResult = await controller.GetNotifications();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<NotificationSummaryResponse>>(okResult.Value);
            Assert.True(response.Success);
            Assert.NotNull(response.Data);

            // User A trong Tenant 1 chỉ có 1 thông báo chưa đọc và tổng cộng 2 thông báo
            Assert.Equal(1, response.Data.UnreadCount);
            Assert.Equal(2, response.Data.Items.Count);

            // Kiểm tra không bị lọt thông báo của User B hoặc của Tenant 2
            Assert.All(response.Data.Items, item =>
            {
                Assert.StartsWith("User A", item.Title);
                Assert.NotEqual("User B Tenant 1", item.Title);
                Assert.NotEqual("User A Tenant 2", item.Title);
            });
        }
    }

    [Fact]
    public async Task NotificationsController_MarkAsRead_ShouldOnlyUpdateOwnNotification()
    {
        // Arrange
        var (context, tenantService) = CreateTestContext();
        await using (context)
        {
            var tenantId = Guid.NewGuid();
            var userAId = Guid.NewGuid();
            var userBId = Guid.NewGuid();

            var notifUserA = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                RecipientUserId = userAId,
                Title = "Notif A",
                Message = "Msg A",
                Type = NotificationType.ClassAssigned,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            var notifUserB = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                RecipientUserId = userBId,
                Title = "Notif B",
                Message = "Msg B",
                Type = NotificationType.ClassAssigned,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow
            };

            context.Notifications.AddRange(notifUserA, notifUserB);
            await context.SaveChangesAsync();

            // Set context là User A
            tenantService.SetTenantContext(tenantId, "test-center", userAId, "Teacher");
            var controller = new NotificationsController(context, tenantService);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userAId.ToString()),
                        new Claim("tenant_id", tenantId.ToString())
                    }, "TestAuth"))
                }
            };

            // Act 1: User A đánh dấu thông báo của chính mình
            var actionResultSuccess = await controller.MarkAsRead(notifUserA.Id);
            var okResult = Assert.IsType<OkObjectResult>(actionResultSuccess);
            var responseSuccess = Assert.IsType<ApiResponse<bool>>(okResult.Value);
            Assert.True(responseSuccess.Success);
            Assert.True(responseSuccess.Data);

            var updatedNotifA = await context.Notifications.FindAsync(notifUserA.Id);
            Assert.NotNull(updatedNotifA);
            Assert.True(updatedNotifA.IsRead);

            // Act 2: User A cố tình đánh dấu thông báo của User B -> 404 NotFound
            var actionResultForbidden = await controller.MarkAsRead(notifUserB.Id);
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResultForbidden);
            var responseForbidden = Assert.IsType<ApiResponse<bool>>(notFoundResult.Value);
            Assert.False(responseForbidden.Success);

            // Đảm bảo thông báo của User B vẫn giữ nguyên IsRead = false
            var untouchedNotifB = await context.Notifications.FindAsync(notifUserB.Id);
            Assert.NotNull(untouchedNotifB);
            Assert.False(untouchedNotifB.IsRead);
        }
    }

    [Fact]
    public async Task NotificationsController_MarkAllAsRead_ShouldOnlyMarkOwnUnreadNotifications()
    {
        // Arrange
        var (context, tenantService) = CreateTestContext();
        await using (context)
        {
            var tenantId = Guid.NewGuid();
            var userAId = Guid.NewGuid();
            var userBId = Guid.NewGuid();

            var notif1A = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                RecipientUserId = userAId,
                Title = "A1",
                Message = "M1",
                Type = NotificationType.ClassAssigned,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            var notif2A = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                RecipientUserId = userAId,
                Title = "A2",
                Message = "M2",
                Type = NotificationType.ClassAssigned,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            var notifB = new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                RecipientUserId = userBId,
                Title = "B1",
                Message = "MB",
                Type = NotificationType.ClassAssigned,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow
            };

            context.Notifications.AddRange(notif1A, notif2A, notifB);
            await context.SaveChangesAsync();

            tenantService.SetTenantContext(tenantId, "test-center", userAId, "Teacher");
            var controller = new NotificationsController(context, tenantService);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userAId.ToString())
                    }, "TestAuth"))
                }
            };

            // Act: User A gọi MarkAllAsRead
            var actionResult = await controller.MarkAllAsRead();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<bool>>(okResult.Value);
            Assert.True(response.Success);
            Assert.True(response.Data);

            var dbNotif1A = await context.Notifications.FindAsync(notif1A.Id);
            var dbNotif2A = await context.Notifications.FindAsync(notif2A.Id);
            var dbNotifB = await context.Notifications.FindAsync(notifB.Id);

            Assert.True(dbNotif1A!.IsRead);
            Assert.True(dbNotif2A!.IsRead);
            Assert.False(dbNotifB!.IsRead); // User B vẫn chưa đọc
        }
    }
}

