using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Api.Controllers;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Attendances;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class AttendanceControllerTests
{
    private static (AppDbContext context, AttendancesController controller, Guid tenantId, Guid teacherId) SetupTest(string role)
    {
        var tenantId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();
        var tenantService = new CurrentTenantService();
        tenantService.SetTenantContext(tenantId, "test-center");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options, tenantService);
        var controller = new AttendancesController(context);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, teacherId.ToString()),
            new(ClaimTypes.Role, role),
            new("tenant_id", tenantId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };

        return (context, controller, tenantId, teacherId);
    }

    [Fact]
    public async Task GetSessionAttendances_ShouldReturnStudentListAndStats()
    {
        var (context, controller, tenantId, teacherId) = SetupTest("Teacher");
        using (context)
        {
            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C# Core" };
            var cls = new Class { Id = Guid.NewGuid(), TenantId = tenantId, CourseId = course.Id, TeacherId = teacherId, Name = "C# Lớp 1", Status = ClassStatus.Ongoing };
            var session = new ClassSession { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = cls.Id, SessionNumber = 1, StartTime = DateTimeOffset.UtcNow, EndTime = DateTimeOffset.UtcNow.AddHours(2) };

            var s1 = new User { Id = Guid.NewGuid(), Email = "s1@test.com", FullName = "Student 1" };
            var s2 = new User { Id = Guid.NewGuid(), Email = "s2@test.com", FullName = "Student 2" };

            context.Users.AddRange(new User { Id = teacherId, Email = "t@test.com", FullName = "Teacher" }, s1, s2);
            context.Courses.Add(course);
            context.Classes.Add(cls);
            context.ClassSessions.Add(session);
            context.Enrollments.AddRange(
                new Enrollment { TenantId = tenantId, ClassId = cls.Id, StudentId = s1.Id },
                new Enrollment { TenantId = tenantId, ClassId = cls.Id, StudentId = s2.Id }
            );
            context.Attendances.Add(new Attendance { TenantId = tenantId, ClassSessionId = session.Id, StudentId = s1.Id, Status = AttendanceStatus.Present });
            await context.SaveChangesAsync();

            // Act
            var actionResult = await controller.GetSessionAttendances(session.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<SessionAttendanceSheetResponse>>(okResult.Value);
            Assert.True(response.Success);
            Assert.Equal(2, response.Data!.TotalStudents);
            Assert.Equal(1, response.Data!.PresentCount);
            Assert.Equal(2, response.Data!.Students.Count);
        }
    }

    [Fact]
    public async Task SaveSessionAttendances_ShouldBatchUpsertAndCommit()
    {
        var (context, controller, tenantId, teacherId) = SetupTest("Teacher");
        using (context)
        {
            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C# Core" };
            var cls = new Class { Id = Guid.NewGuid(), TenantId = tenantId, CourseId = course.Id, TeacherId = teacherId, Name = "C# Lớp 1", Status = ClassStatus.Ongoing };
            var session = new ClassSession { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = cls.Id, SessionNumber = 1, StartTime = DateTimeOffset.UtcNow, EndTime = DateTimeOffset.UtcNow.AddHours(2) };

            var s1 = new User { Id = Guid.NewGuid(), Email = "s1@test.com", FullName = "Student 1" };
            var s2 = new User { Id = Guid.NewGuid(), Email = "s2@test.com", FullName = "Student 2" };

            context.Users.AddRange(new User { Id = teacherId, Email = "t@test.com", FullName = "Teacher" }, s1, s2);
            context.Courses.Add(course);
            context.Classes.Add(cls);
            context.ClassSessions.Add(session);
            context.Enrollments.AddRange(
                new Enrollment { TenantId = tenantId, ClassId = cls.Id, StudentId = s1.Id },
                new Enrollment { TenantId = tenantId, ClassId = cls.Id, StudentId = s2.Id }
            );
            await context.SaveChangesAsync();

            var request = new SaveSessionAttendanceRequest
            {
                Topic = "Giới thiệu LINQ & EF Core",
                Attendances = new List<AttendanceItemRequest>
                {
                    new() { StudentId = s1.Id, Status = AttendanceStatus.Present, Note = "Rất tập trung" },
                    new() { StudentId = s2.Id, Status = AttendanceStatus.Absent, Note = "Nghỉ không phép" }
                }
            };

            // Act
            var actionResult = await controller.SaveSessionAttendances(session.Id, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<bool>>(okResult.Value);
            Assert.True(response.Success);

            var updatedSession = await context.ClassSessions.FindAsync(session.Id);
            Assert.Equal("Giới thiệu LINQ & EF Core", updatedSession!.Topic);

            var attendances = await context.Attendances.Where(a => a.ClassSessionId == session.Id).ToListAsync();
            Assert.Equal(2, attendances.Count);
            Assert.Contains(attendances, a => a.StudentId == s1.Id && a.Status == AttendanceStatus.Present && a.TeacherNote == "Rất tập trung");
            Assert.Contains(attendances, a => a.StudentId == s2.Id && a.Status == AttendanceStatus.Absent && a.TeacherNote == "Nghỉ không phép");
        }
    }
}
