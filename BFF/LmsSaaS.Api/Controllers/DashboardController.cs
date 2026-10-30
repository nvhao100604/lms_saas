using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Dashboard;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext dbContext;
    private readonly ICurrentTenantService currentTenantService;

    public DashboardController(AppDbContext dbContext, ICurrentTenantService currentTenantService)
    {
        this.dbContext = dbContext;
        this.currentTenantService = currentTenantService;
    }

    public DashboardController(AppDbContext dbContext)
        : this(dbContext, new CurrentTenantService())
    {
    }

    private Guid? CurrentUserId
    {
        get
        {
            if (currentTenantService?.UserId.HasValue == true)
                return currentTenantService.UserId.Value;

            var claim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User?.FindFirst("sub")?.Value;

            if (Guid.TryParse(claim, out var parsed))
                return parsed;

            return null;
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var tenantId = currentTenantService.TenantId ?? dbContext.CurrentTenantId;
        if (!tenantId.HasValue)
        {
            return Unauthorized(new ApiResponse<DashboardSummaryResponse>
            {
                Success = false,
                Message = "Ngữ cảnh trung tâm không hợp lệ."
            });
        }

        // 1. KPI Counts
        var totalActiveCourses = await dbContext.Courses
            .CountAsync(c => c.IsActive);

        var totalOngoingClasses = await dbContext.Classes
            .CountAsync(c => c.Status == ClassStatus.Upcoming || c.Status == ClassStatus.Ongoing);

        var totalActiveTeachers = await dbContext.TenantMembers
            .CountAsync(tm => tm.Role == RoleInTenant.Teacher && tm.IsActive);

        var totalActiveStudents = await dbContext.TenantMembers
            .CountAsync(tm => tm.Role == RoleInTenant.Student && tm.IsActive);

        // 2. Attendance Rate
        var totalAttendances = await dbContext.Attendances.CountAsync();
        var attendedCount = await dbContext.Attendances
            .CountAsync(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);

        var attendanceRatePercent = totalAttendances > 0
            ? Math.Round((double)attendedCount * 100.0 / totalAttendances, 1)
            : 100.0;

        // 3. Subscription Quota
        var tenant = await dbContext.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.SubscriptionPlan)
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

        var currentClassesCount = await dbContext.Classes.CountAsync();
        var planName = tenant?.SubscriptionPlan?.Name ?? "Miễn phí";
        var planPrice = tenant?.SubscriptionPlan?.Price ?? 0m;
        var maxClasses = tenant?.SubscriptionPlan?.MaxClassesLimit ?? 3;
        var maxStudents = tenant?.SubscriptionPlan?.MaxStudentsLimit ?? 20;

        var quota = new SubscriptionQuotaResponse(
            planName,
            planPrice,
            currentClassesCount,
            maxClasses,
            totalActiveStudents,
            maxStudents
        );

        // 4. Today / Upcoming Sessions
        var userRole = User?.FindFirstValue(ClaimTypes.Role);
        var currentUserId = CurrentUserId;

        var sessionsQuery = dbContext.ClassSessions
            .AsNoTracking()
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Course)
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Teacher)
            .AsQueryable();

        if (userRole == "Teacher" && currentUserId.HasValue)
        {
            sessionsQuery = sessionsQuery.Where(cs => cs.Class.TeacherId == currentUserId.Value);
        }
        else if (userRole == "Student" && currentUserId.HasValue)
        {
            sessionsQuery = sessionsQuery.Where(cs => cs.Class.Enrollments.Any(e => e.StudentId == currentUserId.Value));
        }

        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.Zero);
        var todayEnd = todayStart.AddDays(1);

        // First check if there are sessions today
        var todaySessions = await sessionsQuery
            .Where(cs => cs.StartTime >= todayStart && cs.StartTime < todayEnd)
            .OrderBy(cs => cs.StartTime)
            .Select(cs => new TodaySessionItemResponse(
                cs.Id,
                cs.ClassId,
                cs.Class.Name,
                cs.Class.Course.Title,
                cs.Class.Teacher.FullName,
                cs.Class.RoomName,
                cs.SessionNumber,
                cs.Topic,
                cs.StartTime,
                cs.EndTime
            ))
            .ToListAsync();

        IReadOnlyList<TodaySessionItemResponse> finalSessions = todaySessions;

        // Fallback: If no sessions today, get top 5 upcoming sessions from now onwards
        if (finalSessions.Count == 0)
        {
            finalSessions = await sessionsQuery
                .Where(cs => cs.StartTime >= now)
                .OrderBy(cs => cs.StartTime)
                .Take(5)
                .Select(cs => new TodaySessionItemResponse(
                    cs.Id,
                    cs.ClassId,
                    cs.Class.Name,
                    cs.Class.Course.Title,
                    cs.Class.Teacher.FullName,
                    cs.Class.RoomName,
                    cs.SessionNumber,
                    cs.Topic,
                    cs.StartTime,
                    cs.EndTime
                ))
                .ToListAsync();
        }

        var response = new DashboardSummaryResponse(
            totalActiveCourses,
            totalOngoingClasses,
            totalActiveTeachers,
            totalActiveStudents,
            attendanceRatePercent,
            quota,
            finalSessions
        );

        return Ok(new ApiResponse<DashboardSummaryResponse>
        {
            Success = true,
            Message = "Lấy dữ liệu thống kê tổng quan thành công.",
            Data = response
        });
    }

    [HttpGet("plans")]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> GetSubscriptionPlans()
    {
        var tenantId = currentTenantService.TenantId ?? dbContext.CurrentTenantId;
        if (!tenantId.HasValue)
        {
            return Unauthorized(new ApiResponse<IReadOnlyList<SubscriptionPlanItemResponse>>
            {
                Success = false,
                Message = "Không xác định được ngữ cảnh trung tâm."
            });
        }

        var tenant = await dbContext.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

        var currentPlanId = tenant?.SubscriptionPlanId;

        var plans = await dbContext.SubscriptionPlans
            .IgnoreQueryFilters()
            .Where(p => p.IsActive)
            .OrderBy(p => p.Price)
            .Select(p => new SubscriptionPlanItemResponse(
                p.Id,
                p.Name,
                p.Price,
                p.MaxClassesLimit,
                p.MaxStudentsLimit,
                p.Id == currentPlanId
            ))
            .ToListAsync();

        return Ok(new ApiResponse<IReadOnlyList<SubscriptionPlanItemResponse>>
        {
            Success = true,
            Message = "Lấy danh sách gói cước thành công.",
            Data = plans
        });
    }

    [HttpPatch("subscription")]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> ChangeSubscriptionPlan([FromBody] ChangeSubscriptionPlanRequest request)
    {
        var tenantId = currentTenantService.TenantId ?? dbContext.CurrentTenantId;
        if (!tenantId.HasValue)
        {
            return Unauthorized(new ApiResponse<SubscriptionQuotaResponse>
            {
                Success = false,
                Message = "Không xác định được ngữ cảnh trung tâm."
            });
        }

        var newPlan = await dbContext.SubscriptionPlans
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == request.PlanId && p.IsActive);

        if (newPlan == null)
        {
            return NotFound(new ApiResponse<SubscriptionQuotaResponse>
            {
                Success = false,
                Message = "Gói cước không tồn tại hoặc đã ngừng cung cấp."
            });
        }

        // Safety Downgrade Check
        var currentClassesCount = await dbContext.Classes
            .CountAsync(c => c.Status == ClassStatus.Upcoming || c.Status == ClassStatus.Ongoing);

        var currentStudentsCount = await dbContext.TenantMembers
            .CountAsync(tm => tm.Role == RoleInTenant.Student && tm.IsActive);

        if (currentClassesCount > newPlan.MaxClassesLimit || currentStudentsCount > newPlan.MaxStudentsLimit)
        {
            return BadRequest(new ApiResponse<SubscriptionQuotaResponse>
            {
                Success = false,
                Message = $"Không thể chuyển sang gói {newPlan.Name} vì số lượng lớp học hoặc học viên hiện tại đang vượt quá giới hạn của gói này."
            });
        }

        var tenant = await dbContext.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

        if (tenant == null)
        {
            return NotFound(new ApiResponse<SubscriptionQuotaResponse>
            {
                Success = false,
                Message = "Không tìm thấy thông tin trung tâm."
            });
        }

        tenant.SubscriptionPlanId = newPlan.Id;
        await dbContext.SaveChangesAsync();

        var quota = new SubscriptionQuotaResponse(
            newPlan.Name,
            newPlan.Price,
            currentClassesCount,
            newPlan.MaxClassesLimit,
            currentStudentsCount,
            newPlan.MaxStudentsLimit
        );

        return Ok(new ApiResponse<SubscriptionQuotaResponse>
        {
            Success = true,
            Message = "Đổi gói cước thành công.",
            Data = quota
        });
    }
}
