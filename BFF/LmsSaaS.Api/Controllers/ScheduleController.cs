using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Schedule;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/schedule")]
[Authorize]
public class ScheduleController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSchedule(
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] Guid? classId,
        [FromQuery] Guid? teacherId)
    {
        // Phân tích khoảng ngày (mặc định Thứ 2 tuần này -> Chủ Nhật tuần này)
        DateTimeOffset fromDate;
        DateTimeOffset toDate;

        var now = DateTimeOffset.UtcNow;
        if (DateTimeOffset.TryParse(from, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsedFrom))
        {
            var utcFrom = parsedFrom.UtcDateTime;
            fromDate = new DateTimeOffset(utcFrom.Year, utcFrom.Month, utcFrom.Day, 0, 0, 0, TimeSpan.Zero);
        }
        else
        {
            var dayOfWeek = (int)now.DayOfWeek;
            var daysToMonday = dayOfWeek == 0 ? -6 : 1 - dayOfWeek;
            var monday = now.AddDays(daysToMonday);
            fromDate = new DateTimeOffset(monday.Year, monday.Month, monday.Day, 0, 0, 0, TimeSpan.Zero);
        }

        if (DateTimeOffset.TryParse(to, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsedTo))
        {
            var utcTo = parsedTo.UtcDateTime;
            toDate = new DateTimeOffset(utcTo.Year, utcTo.Month, utcTo.Day, 0, 0, 0, TimeSpan.Zero).AddDays(1).AddTicks(-1);
        }
        else
        {
            toDate = fromDate.AddDays(7).AddTicks(-1);
        }

        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(currentUserIdStr, out var currentUserId);

        var query = dbContext.ClassSessions
            .AsNoTracking()
            .Where(cs => cs.StartTime >= fromDate && cs.StartTime <= toDate)
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Course)
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Teacher)
            .AsQueryable();

        // Lọc theo vai trò
        if (userRole == "Teacher")
        {
            query = query.Where(cs => cs.Class.TeacherId == currentUserId);
        }
        else if (userRole == "Student")
        {
            query = query.Where(cs => cs.Class.Enrollments.Any(e => e.StudentId == currentUserId));
        }
        else
        {
            // CenterAdmin: lọc tùy chọn theo classId và teacherId
            if (classId.HasValue)
            {
                query = query.Where(cs => cs.ClassId == classId.Value);
            }
            if (teacherId.HasValue)
            {
                query = query.Where(cs => cs.Class.TeacherId == teacherId.Value);
            }
        }

        var sessions = await query
            .OrderBy(cs => cs.StartTime)
            .Select(cs => new
            {
                cs.Id,
                cs.ClassId,
                ClassName = cs.Class.Name,
                cs.Class.CourseId,
                CourseTitle = cs.Class.Course.Title,
                cs.Class.TeacherId,
                TeacherName = cs.Class.Teacher.FullName,
                cs.Class.RoomName,
                cs.SessionNumber,
                cs.Topic,
                cs.StartTime,
                cs.EndTime,
                ClassStatus = cs.Class.Status.ToString(),
                MyAttendance = cs.Attendances
                    .Where(a => a.StudentId == currentUserId)
                    .Select(a => a.Status.ToString())
                    .FirstOrDefault()
            })
            .ToListAsync();

        var result = sessions.Select(s => new ScheduleSessionResponse(
            s.Id,
            s.ClassId,
            s.ClassName,
            s.CourseId,
            s.CourseTitle,
            s.TeacherId,
            s.TeacherName,
            s.RoomName,
            s.SessionNumber,
            s.Topic,
            s.StartTime,
            s.EndTime,
            s.ClassStatus,
            s.MyAttendance
        )).ToList();

        return Ok(new ApiResponse<IReadOnlyList<ScheduleSessionResponse>>
        {
            Success = true,
            Message = "Lấy dữ liệu thời khóa biểu thành công.",
            Data = result
        });
    }
}
