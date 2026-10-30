using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Attendances;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Core.Events;
using LmsSaaS.Infrastructure.Persistence;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/sessions/{sessionId:guid}/attendances")]
[Authorize(Roles = "CenterAdmin,Teacher")]
public class AttendancesController : ControllerBase
{
    private readonly AppDbContext dbContext;
    private readonly IPublishEndpoint? publishEndpoint;

    public AttendancesController(AppDbContext dbContext, IPublishEndpoint? publishEndpoint = null)
    {
        this.dbContext = dbContext;
        this.publishEndpoint = publishEndpoint;
    }

    [HttpGet]
    public async Task<IActionResult> GetSessionAttendances(Guid sessionId)
    {
        var session = await dbContext.ClassSessions
            .AsNoTracking()
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Course)
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Teacher)
            .FirstOrDefaultAsync(cs => cs.Id == sessionId);

        if (session == null)
        {
            return NotFound(new ApiResponse<SessionAttendanceSheetResponse>
            {
                Success = false,
                Message = "Không tìm thấy buổi học."
            });
        }

        // Kiểm tra quyền nếu là Teacher
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(currentUserIdStr, out var currentUserId);

        if (userRole == "Teacher" && session.Class.TeacherId != currentUserId)
        {
            return Forbid();
        }

        // Lấy danh sách học viên ghi danh vào lớp
        var enrolledStudents = await dbContext.Enrollments
            .AsNoTracking()
            .Where(e => e.ClassId == session.ClassId)
            .Include(e => e.Student)
            .OrderBy(e => e.Student.FullName)
            .Select(e => new
            {
                e.StudentId,
                e.Student.FullName,
                e.Student.Email
            })
            .ToListAsync();

        // Lấy danh sách điểm danh hiện tại của buổi học
        var existingAttendances = await dbContext.Attendances
            .AsNoTracking()
            .Where(a => a.ClassSessionId == sessionId)
            .ToDictionaryAsync(a => a.StudentId);

        var studentRows = new List<StudentAttendanceRowResponse>();
        int presentCount = 0;
        int absentCount = 0;
        int lateCount = 0;
        int excusedCount = 0;

        foreach (var student in enrolledStudents)
        {
            if (existingAttendances.TryGetValue(student.StudentId, out var attendance))
            {
                studentRows.Add(new StudentAttendanceRowResponse(
                    student.StudentId,
                    student.FullName,
                    student.Email,
                    attendance.Status.ToString(),
                    attendance.TeacherNote,
                    true
                ));

                switch (attendance.Status)
                {
                    case AttendanceStatus.Present: presentCount++; break;
                    case AttendanceStatus.Absent: absentCount++; break;
                    case AttendanceStatus.Late: lateCount++; break;
                    case AttendanceStatus.Excused: excusedCount++; break;
                }
            }
            else
            {
                studentRows.Add(new StudentAttendanceRowResponse(
                    student.StudentId,
                    student.FullName,
                    student.Email,
                    "NotRecorded",
                    null,
                    false
                ));
            }
        }

        var response = new SessionAttendanceSheetResponse(
            session.Id,
            session.ClassId,
            session.Class.Name,
            session.Class.Course.Title,
            session.Class.Teacher.FullName,
            session.SessionNumber,
            session.Topic,
            session.StartTime,
            session.EndTime,
            enrolledStudents.Count,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
            studentRows
        );

        return Ok(new ApiResponse<SessionAttendanceSheetResponse>
        {
            Success = true,
            Message = "Lấy sổ điểm danh thành công.",
            Data = response
        });
    }

    [HttpPut]
    public async Task<IActionResult> SaveSessionAttendances(Guid sessionId, [FromBody] SaveSessionAttendanceRequest request)
    {
        var session = await dbContext.ClassSessions
            .Include(cs => cs.Class)
            .FirstOrDefaultAsync(cs => cs.Id == sessionId);

        if (session == null)
        {
            return NotFound(new ApiResponse<bool>
            {
                Success = false,
                Message = "Không tìm thấy buổi học."
            });
        }

        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(currentUserIdStr, out var currentUserId);

        if (userRole == "Teacher" && session.Class.TeacherId != currentUserId)
        {
            return Forbid();
        }

        // Cập nhật chủ đề buổi học
        if (request.Topic != null)
        {
            session.Topic = request.Topic.Trim();
        }

        // Database transaction cho batch upsert (nếu provider hỗ trợ - InMemory bypass graceful)
        var isInMemory = dbContext.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";
        var transaction = isInMemory ? null : await dbContext.Database.BeginTransactionAsync();

        try
        {
            var existingAttendances = await dbContext.Attendances
                .Where(a => a.ClassSessionId == sessionId)
                .ToDictionaryAsync(a => a.StudentId);

            var newlyAbsentStudentIds = new List<Guid>();

            foreach (var item in request.Attendances)
            {
                if (existingAttendances.TryGetValue(item.StudentId, out var existing))
                {
                    if (item.Status == AttendanceStatus.Absent && existing.Status != AttendanceStatus.Absent)
                    {
                        newlyAbsentStudentIds.Add(item.StudentId);
                    }

                    existing.Status = item.Status;
                    existing.TeacherNote = item.Note?.Trim();
                }
                else
                {
                    if (item.Status == AttendanceStatus.Absent)
                    {
                        newlyAbsentStudentIds.Add(item.StudentId);
                    }

                    dbContext.Attendances.Add(new Attendance
                    {
                        Id = Guid.NewGuid(),
                        TenantId = session.TenantId,
                        ClassSessionId = sessionId,
                        StudentId = item.StudentId,
                        Status = item.Status,
                        TeacherNote = item.Note?.Trim()
                    });
                }
            }

            await dbContext.SaveChangesAsync();

            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            // Publish sự kiện vắng mặt nếu có
            if (publishEndpoint != null && newlyAbsentStudentIds.Count > 0)
            {
                var tenant = await dbContext.Tenants
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(t => t.Id == session.TenantId);
                var tenantSlug = tenant?.Slug ?? string.Empty;

                foreach (var studentId in newlyAbsentStudentIds)
                {
                    await publishEndpoint.Publish(new StudentAbsentIntegrationEvent(
                        session.TenantId,
                        tenantSlug,
                        session.ClassId,
                        session.Class.Name,
                        session.Id,
                        session.SessionNumber,
                        studentId,
                        session.StartTime
                    ));
                }
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Lưu sổ điểm danh thành công.",
                Data = true
            });
        }
        catch (Exception ex)
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync();
            }

            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = $"Đã xảy ra lỗi khi lưu điểm danh: {ex.Message}"
            });
        }
    }
}
