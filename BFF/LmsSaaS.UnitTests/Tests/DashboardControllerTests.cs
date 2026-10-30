using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Api.Controllers;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Dashboard;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class DashboardControllerTests
{
    private static (AppDbContext context, CurrentTenantService tenantService) CreateInMemoryContext(
        string dbName,
        Guid tenantId,
        Guid? userId = null)
    {
        var tenantService = new CurrentTenantService();
        tenantService.SetTenantContext(tenantId, "test-center", userId);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return (new AppDbContext(options, tenantService), tenantService);
    }

    private static void SetUserContext(ControllerBase controller, Guid userId, string role = "CenterAdmin")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    [Fact]
    public async Task GetDashboard_ReturnsCorrectKpiStats()
    {
        var tenantId = Guid.NewGuid();
        var (context, tenantService) = CreateInMemoryContext(Guid.NewGuid().ToString(), tenantId);
        using (context)
        {
            var plan = new SubscriptionPlan { Id = Guid.NewGuid(), Code = "PRO", Name = "Pro Plan", MaxClassesLimit = 10, MaxStudentsLimit = 50 };
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center", SubscriptionPlanId = plan.Id, SubscriptionPlan = plan };
            context.SubscriptionPlans.Add(plan);
            context.Tenants.Add(tenant);

            // 2 Active Courses, 1 Inactive
            context.Courses.AddRange(
                new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C1", IsActive = true },
                new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C2", IsActive = true },
                new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C3", IsActive = false }
            );

            // 2 Ongoing/Upcoming Classes, 1 Completed
            context.Classes.AddRange(
                new Class { Id = Guid.NewGuid(), TenantId = tenantId, Name = "Class 1", Status = ClassStatus.Ongoing },
                new Class { Id = Guid.NewGuid(), TenantId = tenantId, Name = "Class 2", Status = ClassStatus.Upcoming },
                new Class { Id = Guid.NewGuid(), TenantId = tenantId, Name = "Class 3", Status = ClassStatus.Completed }
            );

            // Users & Members: 1 Admin, 2 Teachers (1 active, 1 inactive), 3 Students (2 active, 1 inactive)
            var uAdmin = new User { Id = Guid.NewGuid(), Email = "admin@t.com", FullName = "Admin" };
            var uT1 = new User { Id = Guid.NewGuid(), Email = "t1@t.com", FullName = "Teacher 1" };
            var uT2 = new User { Id = Guid.NewGuid(), Email = "t2@t.com", FullName = "Teacher 2" };
            var uS1 = new User { Id = Guid.NewGuid(), Email = "s1@t.com", FullName = "Student 1" };
            var uS2 = new User { Id = Guid.NewGuid(), Email = "s2@t.com", FullName = "Student 2" };
            var uS3 = new User { Id = Guid.NewGuid(), Email = "s3@t.com", FullName = "Student 3" };

            context.Users.AddRange(uAdmin, uT1, uT2, uS1, uS2, uS3);
            context.TenantMembers.AddRange(
                new TenantMember { TenantId = tenantId, UserId = uAdmin.Id, Role = RoleInTenant.CenterAdmin, IsActive = true },
                new TenantMember { TenantId = tenantId, UserId = uT1.Id, Role = RoleInTenant.Teacher, IsActive = true },
                new TenantMember { TenantId = tenantId, UserId = uT2.Id, Role = RoleInTenant.Teacher, IsActive = false },
                new TenantMember { TenantId = tenantId, UserId = uS1.Id, Role = RoleInTenant.Student, IsActive = true },
                new TenantMember { TenantId = tenantId, UserId = uS2.Id, Role = RoleInTenant.Student, IsActive = true },
                new TenantMember { TenantId = tenantId, UserId = uS3.Id, Role = RoleInTenant.Student, IsActive = false }
            );

            await context.SaveChangesAsync();

            var controller = new DashboardController(context, tenantService);
            SetUserContext(controller, uAdmin.Id, "CenterAdmin");

            // Act
            var actionResult = await controller.GetDashboard();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<DashboardSummaryResponse>>(okResult.Value);
            Assert.True(response.Success);
            Assert.Equal(2, response.Data!.TotalActiveCourses);
            Assert.Equal(2, response.Data.TotalOngoingClasses);
            Assert.Equal(1, response.Data.TotalActiveTeachers);
            Assert.Equal(2, response.Data.TotalActiveStudents);
        }
    }

    [Fact]
    public async Task GetDashboard_CalculatesAttendanceRateCorrectly()
    {
        var tenantId = Guid.NewGuid();
        var (context, tenantService) = CreateInMemoryContext(Guid.NewGuid().ToString(), tenantId);
        using (context)
        {
            var plan = new SubscriptionPlan { Id = Guid.NewGuid(), Code = "PRO", Name = "Pro Plan" };
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center", SubscriptionPlanId = plan.Id, SubscriptionPlan = plan };
            context.SubscriptionPlans.Add(plan);
            context.Tenants.Add(tenant);

            var controller = new DashboardController(context, tenantService);
            SetUserContext(controller, Guid.NewGuid(), "CenterAdmin");

            // Case 1: 0 attendances -> 100.0%
            var resultNoAttendances = await controller.GetDashboard();
            var okResult1 = Assert.IsType<OkObjectResult>(resultNoAttendances);
            var res1 = Assert.IsType<ApiResponse<DashboardSummaryResponse>>(okResult1.Value);
            Assert.Equal(100.0, res1.Data!.AttendanceRatePercent);

            // Case 2: 3 Present, 1 Late, 1 Absent -> 4 / 5 = 80.0%
            context.Attendances.AddRange(
                new Attendance { TenantId = tenantId, StudentId = Guid.NewGuid(), Status = AttendanceStatus.Present },
                new Attendance { TenantId = tenantId, StudentId = Guid.NewGuid(), Status = AttendanceStatus.Present },
                new Attendance { TenantId = tenantId, StudentId = Guid.NewGuid(), Status = AttendanceStatus.Present },
                new Attendance { TenantId = tenantId, StudentId = Guid.NewGuid(), Status = AttendanceStatus.Late },
                new Attendance { TenantId = tenantId, StudentId = Guid.NewGuid(), Status = AttendanceStatus.Absent }
            );
            await context.SaveChangesAsync();

            var resultWithAttendances = await controller.GetDashboard();
            var okResult2 = Assert.IsType<OkObjectResult>(resultWithAttendances);
            var res2 = Assert.IsType<ApiResponse<DashboardSummaryResponse>>(okResult2.Value);
            Assert.Equal(80.0, res2.Data!.AttendanceRatePercent);
        }
    }

    [Fact]
    public async Task GetDashboard_ReturnsCorrectSubscriptionQuota()
    {
        var tenantId = Guid.NewGuid();
        var (context, tenantService) = CreateInMemoryContext(Guid.NewGuid().ToString(), tenantId);
        using (context)
        {
            var plan = new SubscriptionPlan
            {
                Id = Guid.NewGuid(),
                Code = "PRO",
                Name = "Gói Chuyên Nghiệp",
                Price = 500000m,
                MaxClassesLimit = 15,
                MaxStudentsLimit = 100
            };
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center", SubscriptionPlanId = plan.Id, SubscriptionPlan = plan };
            context.SubscriptionPlans.Add(plan);
            context.Tenants.Add(tenant);

            context.Classes.AddRange(
                new Class { Id = Guid.NewGuid(), TenantId = tenantId, Name = "Class 1" },
                new Class { Id = Guid.NewGuid(), TenantId = tenantId, Name = "Class 2" },
                new Class { Id = Guid.NewGuid(), TenantId = tenantId, Name = "Class 3" }
            );

            var s1 = new User { Id = Guid.NewGuid(), Email = "s1@test.com", FullName = "S1" };
            context.Users.Add(s1);
            context.TenantMembers.Add(new TenantMember { TenantId = tenantId, UserId = s1.Id, Role = RoleInTenant.Student, IsActive = true });
            await context.SaveChangesAsync();

            var controller = new DashboardController(context, tenantService);
            SetUserContext(controller, Guid.NewGuid(), "CenterAdmin");

            var actionResult = await controller.GetDashboard();
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<DashboardSummaryResponse>>(okResult.Value);

            Assert.Equal("Gói Chuyên Nghiệp", response.Data!.Quota.PlanName);
            Assert.Equal(500000m, response.Data.Quota.MonthlyPrice);
            Assert.Equal(3, response.Data.Quota.CurrentClassesCount);
            Assert.Equal(15, response.Data.Quota.MaxClassesLimit);
            Assert.Equal(1, response.Data.Quota.CurrentStudentsCount);
            Assert.Equal(100, response.Data.Quota.MaxStudentsLimit);
        }
    }

    [Fact]
    public async Task GetDashboard_RoleBasedSessionsScoping()
    {
        var tenantId = Guid.NewGuid();
        var teacher1Id = Guid.NewGuid();
        var teacher2Id = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var (context, tenantService) = CreateInMemoryContext(Guid.NewGuid().ToString(), tenantId, teacher1Id);
        using (context)
        {
            var plan = new SubscriptionPlan { Id = Guid.NewGuid(), Code = "FREE", Name = "Free" };
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center", SubscriptionPlanId = plan.Id, SubscriptionPlan = plan };
            context.SubscriptionPlans.Add(plan);
            context.Tenants.Add(tenant);

            var uTeacher1 = new User { Id = teacher1Id, Email = "t1@test.com", FullName = "Teacher One" };
            var uTeacher2 = new User { Id = teacher2Id, Email = "t2@test.com", FullName = "Teacher Two" };
            var uStudent = new User { Id = studentId, Email = "s@test.com", FullName = "Student One" };
            context.Users.AddRange(uTeacher1, uTeacher2, uStudent);

            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C# Mastery" };
            context.Courses.Add(course);

            var class1 = new Class { Id = Guid.NewGuid(), TenantId = tenantId, CourseId = course.Id, TeacherId = teacher1Id, Name = "Teacher 1 Class", Course = course, Teacher = uTeacher1 };
            var class2 = new Class { Id = Guid.NewGuid(), TenantId = tenantId, CourseId = course.Id, TeacherId = teacher2Id, Name = "Teacher 2 Class", Course = course, Teacher = uTeacher2 };
            context.Classes.AddRange(class1, class2);

            // Student enrolled only in class2
            context.Enrollments.Add(new Enrollment { TenantId = tenantId, ClassId = class2.Id, StudentId = studentId });

            var now = DateTimeOffset.UtcNow;
            var session1 = new ClassSession { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = class1.Id, SessionNumber = 1, StartTime = now.AddHours(1), EndTime = now.AddHours(3), Class = class1 };
            var session2 = new ClassSession { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = class2.Id, SessionNumber = 1, StartTime = now.AddHours(2), EndTime = now.AddHours(4), Class = class2 };
            context.ClassSessions.AddRange(session1, session2);
            await context.SaveChangesAsync();

            var controller = new DashboardController(context, tenantService);

            // 1. As Teacher 1 -> should only see session 1
            SetUserContext(controller, teacher1Id, "Teacher");
            var resTeacher = await controller.GetDashboard();
            var okTeacher = Assert.IsType<OkObjectResult>(resTeacher);
            var dataTeacher = Assert.IsType<ApiResponse<DashboardSummaryResponse>>(okTeacher.Value);
            Assert.Single(dataTeacher.Data!.TodaySessions);
            Assert.Equal("Teacher 1 Class", dataTeacher.Data.TodaySessions[0].ClassName);

            // 2. As Student -> should only see session 2
            tenantService.SetTenantContext(tenantId, "test-center", studentId);
            SetUserContext(controller, studentId, "Student");
            var resStudent = await controller.GetDashboard();
            var okStudent = Assert.IsType<OkObjectResult>(resStudent);
            var dataStudent = Assert.IsType<ApiResponse<DashboardSummaryResponse>>(okStudent.Value);
            Assert.Single(dataStudent.Data!.TodaySessions);
            Assert.Equal("Teacher 2 Class", dataStudent.Data.TodaySessions[0].ClassName);

            // 3. As CenterAdmin -> should see both sessions
            tenantService.SetTenantContext(tenantId, "test-center", Guid.NewGuid());
            SetUserContext(controller, Guid.NewGuid(), "CenterAdmin");
            var resAdmin = await controller.GetDashboard();
            var okAdmin = Assert.IsType<OkObjectResult>(resAdmin);
            var dataAdmin = Assert.IsType<ApiResponse<DashboardSummaryResponse>>(okAdmin.Value);
            Assert.Equal(2, dataAdmin.Data!.TodaySessions.Count);
        }
    }

    [Fact]
    public async Task GetDashboard_FallbackToUpcomingSessionsWhenNoTodaySessions()
    {
        var tenantId = Guid.NewGuid();
        var (context, tenantService) = CreateInMemoryContext(Guid.NewGuid().ToString(), tenantId);
        using (context)
        {
            var plan = new SubscriptionPlan { Id = Guid.NewGuid(), Code = "FREE", Name = "Free" };
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center", SubscriptionPlanId = plan.Id, SubscriptionPlan = plan };
            context.SubscriptionPlans.Add(plan);
            context.Tenants.Add(tenant);

            var teacher = new User { Id = Guid.NewGuid(), Email = "t@test.com", FullName = "Teacher" };
            context.Users.Add(teacher);

            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C# Core" };
            context.Courses.Add(course);

            var cls = new Class { Id = Guid.NewGuid(), TenantId = tenantId, CourseId = course.Id, TeacherId = teacher.Id, Name = "C# Class", Course = course, Teacher = teacher };
            context.Classes.Add(cls);

            // 6 future sessions starting from tomorrow (no sessions today)
            var futureDate = DateTimeOffset.UtcNow.AddDays(2);
            for (int i = 1; i <= 6; i++)
            {
                context.ClassSessions.Add(new ClassSession
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    ClassId = cls.Id,
                    SessionNumber = i,
                    StartTime = futureDate.AddDays(i),
                    EndTime = futureDate.AddDays(i).AddHours(2),
                    Class = cls
                });
            }
            await context.SaveChangesAsync();

            var controller = new DashboardController(context, tenantService);
            SetUserContext(controller, Guid.NewGuid(), "CenterAdmin");

            var actionResult = await controller.GetDashboard();
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<DashboardSummaryResponse>>(okResult.Value);

            // Fallback should take top 5 upcoming sessions
            Assert.Equal(5, response.Data!.TodaySessions.Count);
            Assert.Equal(1, response.Data.TodaySessions[0].SessionNumber);
            Assert.Equal(5, response.Data.TodaySessions[4].SessionNumber);
        }
    }
}
