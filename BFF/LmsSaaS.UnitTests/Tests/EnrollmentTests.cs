using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LmsSaaS.Api.Controllers;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Classes;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class EnrollmentTests
{
    private static (AppDbContext context, ClassesController controller, Guid tenantId) SetupTestEnvironment()
    {
        var tenantId = Guid.NewGuid();
        var tenantService = new CurrentTenantService();
        tenantService.SetTenantContext(tenantId, "test-center");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options, tenantService);

        var scheduleGenerator = new ScheduleGeneratorService();
        var controller = new ClassesController(context, scheduleGenerator, tenantService);

        return (context, controller, tenantId);
    }

    [Fact]
    public async Task EnrollStudent_WhenClassFull_ShouldReturnBadRequest()
    {
        var (context, controller, tenantId) = SetupTestEnvironment();
        using (context)
        {
            var teacher = new User { Id = Guid.NewGuid(), Email = "t@test.com", FullName = "Teacher" };
            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C# Mastery" };
            var cls = new Class
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CourseId = course.Id,
                TeacherId = teacher.Id,
                Name = "C# 01",
                MaxCapacity = 1,
                Status = ClassStatus.Ongoing
            };

            var student1 = new User { Id = Guid.NewGuid(), Email = "s1@test.com", FullName = "Student 1" };
            var student2 = new User { Id = Guid.NewGuid(), Email = "s2@test.com", FullName = "Student 2" };

            context.Users.AddRange(teacher, student1, student2);
            context.Courses.Add(course);
            context.Classes.Add(cls);
            context.TenantMembers.AddRange(
                new TenantMember { TenantId = tenantId, UserId = student1.Id, Role = RoleInTenant.Student },
                new TenantMember { TenantId = tenantId, UserId = student2.Id, Role = RoleInTenant.Student }
            );
            context.Enrollments.Add(new Enrollment
            {
                TenantId = tenantId,
                ClassId = cls.Id,
                StudentId = student1.Id,
                EnrolledAt = DateTimeOffset.UtcNow
            });
            await context.SaveChangesAsync();

            // Act - Thử ghi danh student2 vào lớp đã đầy
            var actionResult = await controller.EnrollStudent(cls.Id, new CreateEnrollmentRequest { StudentId = student2.Id });

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<ClassEnrollmentResponse>>(badRequest.Value);
            Assert.False(response.Success);
            Assert.Contains("đã đạt sĩ số tối đa", response.Message);
        }
    }

    [Fact]
    public async Task EnrollStudent_WhenDuplicate_ShouldReturnBadRequest()
    {
        var (context, controller, tenantId) = SetupTestEnvironment();
        using (context)
        {
            var teacher = new User { Id = Guid.NewGuid(), Email = "t@test.com", FullName = "Teacher" };
            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C# Mastery" };
            var cls = new Class
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CourseId = course.Id,
                TeacherId = teacher.Id,
                Name = "C# 01",
                MaxCapacity = 10,
                Status = ClassStatus.Ongoing
            };
            var student = new User { Id = Guid.NewGuid(), Email = "s@test.com", FullName = "Student" };

            context.Users.AddRange(teacher, student);
            context.Courses.Add(course);
            context.Classes.Add(cls);
            context.TenantMembers.Add(new TenantMember { TenantId = tenantId, UserId = student.Id, Role = RoleInTenant.Student });
            context.Enrollments.Add(new Enrollment
            {
                TenantId = tenantId,
                ClassId = cls.Id,
                StudentId = student.Id
            });
            await context.SaveChangesAsync();

            // Act
            var actionResult = await controller.EnrollStudent(cls.Id, new CreateEnrollmentRequest { StudentId = student.Id });

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<ClassEnrollmentResponse>>(badRequest.Value);
            Assert.False(response.Success);
            Assert.Contains("đã được ghi danh", response.Message);
        }
    }

    [Fact]
    public async Task EnrollStudent_WhenValid_ShouldSucceed()
    {
        var (context, controller, tenantId) = SetupTestEnvironment();
        using (context)
        {
            var teacher = new User { Id = Guid.NewGuid(), Email = "t@test.com", FullName = "Teacher" };
            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C# Mastery" };
            var cls = new Class
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CourseId = course.Id,
                TeacherId = teacher.Id,
                Name = "C# 01",
                MaxCapacity = 10,
                Status = ClassStatus.Ongoing
            };
            var student = new User { Id = Guid.NewGuid(), Email = "s@test.com", FullName = "Student" };

            context.Users.AddRange(teacher, student);
            context.Courses.Add(course);
            context.Classes.Add(cls);
            context.TenantMembers.Add(new TenantMember { TenantId = tenantId, UserId = student.Id, Role = RoleInTenant.Student });
            await context.SaveChangesAsync();

            // Act
            var actionResult = await controller.EnrollStudent(cls.Id, new CreateEnrollmentRequest { StudentId = student.Id });

            // Assert
            var okResult = Assert.IsType<CreatedResult>(actionResult);
            var response = Assert.IsType<ApiResponse<ClassEnrollmentResponse>>(okResult.Value);
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal(student.Id, response.Data.StudentId);
            Assert.Equal("Student", response.Data.StudentName);
        }
    }

    [Fact]
    public async Task RemoveStudent_ShouldDeleteEnrollment()
    {
        var (context, controller, tenantId) = SetupTestEnvironment();
        using (context)
        {
            var teacher = new User { Id = Guid.NewGuid(), Email = "t@test.com", FullName = "Teacher" };
            var course = new Course { Id = Guid.NewGuid(), TenantId = tenantId, Title = "C# Mastery" };
            var cls = new Class
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CourseId = course.Id,
                TeacherId = teacher.Id,
                Name = "C# 01",
                MaxCapacity = 10,
                Status = ClassStatus.Ongoing
            };
            var student = new User { Id = Guid.NewGuid(), Email = "s@test.com", FullName = "Student" };

            context.Users.AddRange(teacher, student);
            context.Courses.Add(course);
            context.Classes.Add(cls);
            var enrollment = new Enrollment
            {
                TenantId = tenantId,
                ClassId = cls.Id,
                StudentId = student.Id
            };
            context.Enrollments.Add(enrollment);
            await context.SaveChangesAsync();

            // Act
            var actionResult = await controller.RemoveStudent(cls.Id, student.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var exists = await context.Enrollments.AnyAsync(e => e.ClassId == cls.Id && e.StudentId == student.Id);
            Assert.False(exists);
        }
    }
}
