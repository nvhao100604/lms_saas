using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Classes;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/classes")]
[Authorize]
public class ClassesController(
    AppDbContext dbContext,
    IScheduleGeneratorService scheduleGenerator,
    ICurrentTenantService currentTenantService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var classes = await dbContext.Classes
            .AsNoTracking()
            .Include(c => c.Course)
            .Include(c => c.Teacher)
            .Include(c => c.Sessions)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClassResponse(
                c.Id,
                c.CourseId,
                c.Course.Title,
                c.TeacherId,
                c.Teacher.FullName,
                c.Name,
                c.RoomName,
                c.StartDate,
                c.EndDate,
                c.MaxCapacity,
                c.Status.ToString(),
                c.Sessions.Count,
                null
            ))
            .ToListAsync();

        return Ok(new ApiResponse<IReadOnlyList<ClassResponse>>
        {
            Success = true,
            Message = "Lấy danh sách lớp học thành công.",
            Data = classes
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var @class = await dbContext.Classes
            .AsNoTracking()
            .Include(c => c.Course)
            .Include(c => c.Teacher)
            .Include(c => c.Sessions)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (@class == null)
        {
            return NotFound(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Không tìm thấy lớp học."
            });
        }

        var sessionResponses = @class.Sessions
            .OrderBy(s => s.SessionNumber)
            .Select(s => new ClassSessionResponse(
                s.Id,
                s.SessionNumber,
                s.Topic,
                s.StartTime,
                s.EndTime
            ))
            .ToList();

        var response = new ClassResponse(
            @class.Id,
            @class.CourseId,
            @class.Course.Title,
            @class.TeacherId,
            @class.Teacher.FullName,
            @class.Name,
            @class.RoomName,
            @class.StartDate,
            @class.EndDate,
            @class.MaxCapacity,
            @class.Status.ToString(),
            @class.Sessions.Count,
            sessionResponses
        );

        return Ok(new ApiResponse<ClassResponse>
        {
            Success = true,
            Data = response
        });
    }

    [HttpPost]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateClassRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Dữ liệu yêu cầu không hợp lệ."
            });
        }

        var tenantId = currentTenantService.TenantId;
        if (!tenantId.HasValue)
        {
            return Unauthorized(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Ngữ cảnh trung tâm không hợp lệ."
            });
        }

        // 1. Kiểm soát hạn ngạch gói cước (MaxClassesLimit Enforcement)
        var tenant = await dbContext.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.SubscriptionPlan)
            .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

        if (tenant?.SubscriptionPlan != null)
        {
            var currentClassCount = await dbContext.Classes.CountAsync();
            if (currentClassCount >= tenant.SubscriptionPlan.MaxClassesLimit)
            {
                return BadRequest(new ApiResponse<ClassResponse>
                {
                    Success = false,
                    Message = $"Trung tâm đã đạt giới hạn tối đa {tenant.SubscriptionPlan.MaxClassesLimit} lớp học của gói {tenant.SubscriptionPlan.Name}. Vui lòng nâng cấp gói cước để mở thêm lớp."
                });
            }
        }

        // 2. Kiểm tra tồn tại của Course và Teacher
        var course = await dbContext.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId);
        if (course == null)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Khóa học được chọn không tồn tại hoặc không thuộc trung tâm này."
            });
        }

        var teacher = await dbContext.Users.FindAsync(request.TeacherId);
        if (teacher == null)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Giảng viên được chỉ định không tồn tại trên hệ thống."
            });
        }

        // 3. Kiểm tra tính hợp lệ của ngày và lịch học
        if (request.StartDate > request.EndDate)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Ngày bắt đầu (StartDate) phải trước hoặc bằng ngày kết thúc (EndDate)."
            });
        }

        if (request.Schedule == null || request.Schedule.DaysOfWeek == null || request.Schedule.DaysOfWeek.Count == 0)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Lịch học yêu cầu cấu hình ít nhất một thứ trong tuần (DaysOfWeek)."
            });
        }

        if (request.Schedule.StartTime >= request.Schedule.EndTime)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Giờ bắt đầu buổi học (StartTime) phải trước giờ kết thúc (EndTime)."
            });
        }

        // 4. Tự động sinh buổi học (ClassSessions)
        var classId = Guid.NewGuid();
        List<ClassSession> sessions;
        try
        {
            sessions = scheduleGenerator.GenerateSessions(tenantId.Value, classId, request.StartDate, request.EndDate, request.Schedule);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = ex.Message
            });
        }

        if (sessions.Count == 0)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Không có buổi học nào được sinh ra trong khoảng thời gian đã chọn với cấu hình thứ trong tuần hiện tại."
            });
        }

        // 5. Thuật toán chống trùng lịch giảng viên (Conflict Detection)
        var minNewStart = sessions.Min(s => s.StartTime);
        var maxNewEnd = sessions.Max(s => s.EndTime);

        var existingTeacherSessions = await dbContext.ClassSessions
            .Include(cs => cs.Class)
            .Where(cs => cs.Class.TeacherId == request.TeacherId &&
                         cs.Class.Status != ClassStatus.Cancelled &&
                         cs.StartTime < maxNewEnd &&
                         cs.EndTime > minNewStart)
            .AsNoTracking()
            .ToListAsync();

        foreach (var newSession in sessions)
        {
            var conflict = existingTeacherSessions.FirstOrDefault(e =>
                newSession.StartTime < e.EndTime && newSession.EndTime > e.StartTime);

            if (conflict != null)
            {
                return BadRequest(new ApiResponse<ClassResponse>
                {
                    Success = false,
                    Message = $"Giảng viên {teacher.FullName} đã có lịch dạy bị trùng với lớp '{conflict.Class.Name}' vào ngày {conflict.StartTime:dd/MM/yyyy} khung giờ {conflict.StartTime:HH:mm} - {conflict.EndTime:HH:mm} (UTC)."
                });
            }
        }

        // 6. Database Transaction (All-or-Nothing)
        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        try
        {
            var @class = new Class
            {
                Id = classId,
                TenantId = tenantId.Value,
                CourseId = request.CourseId,
                TeacherId = request.TeacherId,
                Name = request.Name.Trim(),
                RoomName = request.RoomName?.Trim() ?? string.Empty,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                MaxCapacity = request.MaxCapacity,
                Status = ClassStatus.Upcoming,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Classes.Add(@class);
            dbContext.ClassSessions.AddRange(sessions);
            await dbContext.SaveChangesAsync();

            await transaction.CommitAsync();

            var sessionResponses = sessions
                .OrderBy(s => s.SessionNumber)
                .Select(s => new ClassSessionResponse(s.Id, s.SessionNumber, s.Topic, s.StartTime, s.EndTime))
                .ToList();

            var response = new ClassResponse(
                @class.Id,
                course.Id,
                course.Title,
                teacher.Id,
                teacher.FullName,
                @class.Name,
                @class.RoomName,
                @class.StartDate,
                @class.EndDate,
                @class.MaxCapacity,
                @class.Status.ToString(),
                sessions.Count,
                sessionResponses
            );

            return CreatedAtAction(nameof(GetById), new { id = @class.Id }, new ApiResponse<ClassResponse>
            {
                Success = true,
                Message = "Tạo lớp học và sinh lịch học thành công.",
                Data = response
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Đã xảy ra lỗi khi lưu lớp học và lịch học.",
                Error = ex.Message
            });
        }
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> Patch(Guid id, [FromBody] PatchClassRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Dữ liệu yêu cầu không hợp lệ."
            });
        }

        var @class = await dbContext.Classes
            .Include(c => c.Course)
            .Include(c => c.Teacher)
            .Include(c => c.Sessions)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (@class == null)
        {
            return NotFound(new ApiResponse<ClassResponse>
            {
                Success = false,
                Message = "Không tìm thấy lớp học để cập nhật."
            });
        }

        var patchValues = request.ToPatchDictionary();
        if (patchValues.Count > 0)
        {
            dbContext.Entry(@class).CurrentValues.SetValues(patchValues);
            await dbContext.SaveChangesAsync();
        }

        var response = new ClassResponse(
            @class.Id,
            @class.CourseId,
            @class.Course.Title,
            @class.TeacherId,
            @class.Teacher.FullName,
            @class.Name,
            @class.RoomName,
            @class.StartDate,
            @class.EndDate,
            @class.MaxCapacity,
            @class.Status.ToString(),
            @class.Sessions.Count,
            null
        );

        return Ok(new ApiResponse<ClassResponse>
        {
            Success = true,
            Message = "Cập nhật thông tin lớp học thành công.",
            Data = response
        });
    }
}
