using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Notifications;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(
    AppDbContext dbContext,
    ICurrentTenantService currentTenantService) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            if (currentTenantService.UserId.HasValue)
            {
                return currentTenantService.UserId.Value;
            }

            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = CurrentUserId;
        if (!userId.HasValue)
        {
            return Unauthorized(new ApiResponse<NotificationSummaryResponse>
            {
                Success = false,
                Message = "Không xác định được danh tính người dùng."
            });
        }

        var items = await dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientUserId == userId.Value)
            .OrderByDescending(n => n.CreatedAt)
            .Take(20)
            .Select(n => new NotificationResponse(
                n.Id,
                n.Title,
                n.Message,
                n.Type.ToString(),
                n.ActionUrl,
                n.IsRead,
                n.CreatedAt
            ))
            .ToListAsync();

        var unreadCount = await dbContext.Notifications
            .Where(n => n.RecipientUserId == userId.Value && !n.IsRead)
            .CountAsync();

        return Ok(new ApiResponse<NotificationSummaryResponse>
        {
            Success = true,
            Message = "Lấy danh sách thông báo thành công.",
            Data = new NotificationSummaryResponse(unreadCount, items)
        });
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = CurrentUserId;
        if (!userId.HasValue)
        {
            return Unauthorized(new ApiResponse<bool>
            {
                Success = false,
                Message = "Không xác định được danh tính người dùng."
            });
        }

        var notification = await dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientUserId == userId.Value);

        if (notification == null)
        {
            return NotFound(new ApiResponse<bool>
            {
                Success = false,
                Message = "Không tìm thấy thông báo hoặc bạn không có quyền truy cập."
            });
        }

        notification.IsRead = true;
        await dbContext.SaveChangesAsync();

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = "Đánh dấu thông báo đã đọc thành công.",
            Data = true
        });
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = CurrentUserId;
        if (!userId.HasValue)
        {
            return Unauthorized(new ApiResponse<bool>
            {
                Success = false,
                Message = "Không xác định được danh tính người dùng."
            });
        }

        var unreadNotifications = await dbContext.Notifications
            .Where(n => n.RecipientUserId == userId.Value && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        await dbContext.SaveChangesAsync();

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = "Đánh dấu tất cả thông báo đã đọc thành công.",
            Data = true
        });
    }
}

