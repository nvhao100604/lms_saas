using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Api.Controllers;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Schedule;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class ScheduleControllerTests
{
    private static (AppDbContext context, ScheduleController controller, Guid tenantId, Guid userId) SetupTestController(string role)
    {
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var tenantService = new CurrentTenantService();
        tenantService.SetTenantContext(tenantId, "test-center");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options, tenantService);
        var controller = new ScheduleController(context);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, role),
            new("tenant_id", tenantId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };

        return (context, controller, tenantId, userId);
    }

    [Fact]
    public async Task GetSchedule_AsTeacher_ShouldReturnOnlyTeacherClasses()
    {
        var (context, controller, tenantId, teacherId) = SetupTestController("Teacher");
        using (context)
        {
            var otherTeacherId = Guid.NewGuid();
            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "Web Dev" };
            var class1 = new Class { Id = Guid.NewGuid(), TenantId = tenantId, CourseId = course.Id, TeacherId = teacherId, Name = "Class 1", Status = ClassStatus.Ongoing };
            var class2 = new Class { Id = Guid.NewGuid(), TenantId = tenantId, CourseId = course.Id, TeacherId = otherTeacherId, Name = "Class 2", Status = ClassStatus.Ongoing };

            var now = DateTimeOffset.UtcNow;
            var session1 = new ClassSession { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = class1.Id, SessionNumber = 1, StartTime = now.AddHours(1), EndTime = now.AddHours(3) };
            var session2 = new ClassSession { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = class2.Id, SessionNumber = 1, StartTime = now.AddHours(1), EndTime = now.AddHours(3) };

            context.Users.AddRange(
                new User { Id = teacherId, Email = "t1@test.com", FullName = "My Teacher" },
                new User { Id = otherTeacherId, Email = "t2@test.com", FullName = "Other Teacher" }
            );
            context.Courses.Add(course);
            context.Classes.AddRange(class1, class2);
            context.ClassSessions.AddRange(session1, session2);
            await context.SaveChangesAsync();

            // Act
            var actionResult = await controller.GetSchedule(now.Date.ToString("yyyy-MM-dd"), now.AddDays(7).Date.ToString("yyyy-MM-dd"), null, null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<IReadOnlyList<ScheduleSessionResponse>>>(okResult.Value);
            Assert.True(response.Success);
            Assert.Single(response.Data!);
            Assert.Equal(class1.Id, response.Data![0].ClassId);
        }
    }

    [Fact]
    public async Task GetSchedule_AsStudent_ShouldReturnEnrolledClassesWithMyAttendanceStatus()
    {
        var (context, controller, tenantId, studentId) = SetupTestController("Student");
        using (context)
        {
            var teacher = new User { Id = Guid.NewGuid(), Email = "t@test.com", FullName = "Teacher" };
            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "Web Dev" };
            var class1 = new Class { Id = Guid.NewGuid(), TenantId = tenantId, CourseId = course.Id, TeacherId = teacher.Id, Name = "Class 1", Status = ClassStatus.Ongoing };

            var now = DateTimeOffset.UtcNow;
            var session1 = new ClassSession { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = class1.Id, SessionNumber = 1, StartTime = now.AddHours(1), EndTime = now.AddHours(3) };

            context.Users.AddRange(teacher, new User { Id = studentId, Email = "st@test.com", FullName = "Student Me" });
            context.Courses.Add(course);
            context.Classes.Add(class1);
            context.ClassSessions.Add(session1);
            context.Enrollments.Add(new Enrollment { TenantId = tenantId, ClassId = class1.Id, StudentId = studentId });
            context.Attendances.Add(new Attendance { TenantId = tenantId, ClassSessionId = session1.Id, StudentId = studentId, Status = AttendanceStatus.Present });
            await context.SaveChangesAsync();

            // Act
            var actionResult = await controller.GetSchedule(now.Date.ToString("yyyy-MM-dd"), now.AddDays(7).Date.ToString("yyyy-MM-dd"), null, null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<IReadOnlyList<ScheduleSessionResponse>>>(okResult.Value);
            Assert.True(response.Success);
            Assert.Single(response.Data!);
            Assert.Equal("Present", response.Data![0].MyAttendanceStatus);
        }
    }
}
