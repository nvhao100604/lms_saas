using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LmsSaaS.Api.Controllers;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Members;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class MembersControllerTests
{
    private static AppDbContext CreateInMemoryContext(string dbName, Guid tenantId)
    {
        var tenantService = new LmsSaaS.Infrastructure.Services.CurrentTenantService();
        tenantService.SetTenantContext(tenantId, "test-center");
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options, tenantService);
    }

    [Fact]
    public async Task GetTeachers_ShouldReturnOnlyTeachersAndCenterAdmins()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateInMemoryContext(dbName, tenantId);

        var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center" };
        var userAdmin = new User { Id = Guid.NewGuid(), Email = "admin@test.com", FullName = "Admin User" };
        var userTeacher = new User { Id = Guid.NewGuid(), Email = "teacher@test.com", FullName = "Teacher User" };
        var userStudent = new User { Id = Guid.NewGuid(), Email = "student@test.com", FullName = "Student User" };

        context.Tenants.Add(tenant);
        context.Users.AddRange(userAdmin, userTeacher, userStudent);

        context.TenantMembers.AddRange(
            new TenantMember { TenantId = tenantId, UserId = userAdmin.Id, Role = RoleInTenant.CenterAdmin, User = userAdmin, Tenant = tenant },
            new TenantMember { TenantId = tenantId, UserId = userTeacher.Id, Role = RoleInTenant.Teacher, User = userTeacher, Tenant = tenant },
            new TenantMember { TenantId = tenantId, UserId = userStudent.Id, Role = RoleInTenant.Student, User = userStudent, Tenant = tenant }
        );

        await context.SaveChangesAsync();

        var controller = new MembersController(context);

        // Act
        var actionResult = await controller.GetTeachers();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<IReadOnlyList<TenantTeacherResponse>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(2, response.Data.Count);

        var roles = response.Data.Select(t => t.Role).ToList();
        Assert.Contains(RoleInTenant.CenterAdmin.ToString(), roles);
        Assert.Contains(RoleInTenant.Teacher.ToString(), roles);
        Assert.DoesNotContain(RoleInTenant.Student.ToString(), roles);
    }

    [Fact]
    public async Task GetStudents_ShouldReturnOnlyStudents()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateInMemoryContext(dbName, tenantId);

        var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center" };
        var userAdmin = new User { Id = Guid.NewGuid(), Email = "admin@test.com", FullName = "Admin User" };
        var userTeacher = new User { Id = Guid.NewGuid(), Email = "teacher@test.com", FullName = "Teacher User" };
        var userStudent1 = new User { Id = Guid.NewGuid(), Email = "student1@test.com", FullName = "Student One" };
        var userStudent2 = new User { Id = Guid.NewGuid(), Email = "student2@test.com", FullName = "Student Two" };

        context.Tenants.Add(tenant);
        context.Users.AddRange(userAdmin, userTeacher, userStudent1, userStudent2);

        context.TenantMembers.AddRange(
            new TenantMember { TenantId = tenantId, UserId = userAdmin.Id, Role = RoleInTenant.CenterAdmin, User = userAdmin, Tenant = tenant },
            new TenantMember { TenantId = tenantId, UserId = userTeacher.Id, Role = RoleInTenant.Teacher, User = userTeacher, Tenant = tenant },
            new TenantMember { TenantId = tenantId, UserId = userStudent1.Id, Role = RoleInTenant.Student, User = userStudent1, Tenant = tenant },
            new TenantMember { TenantId = tenantId, UserId = userStudent2.Id, Role = RoleInTenant.Student, User = userStudent2, Tenant = tenant }
        );

        await context.SaveChangesAsync();

        var controller = new MembersController(context);

        // Act
        var actionResult = await controller.GetStudents();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<IReadOnlyList<TenantStudentResponse>>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(2, response.Data.Count);

        var emails = response.Data.Select(s => s.Email).ToList();
        Assert.Contains("student1@test.com", emails);
        Assert.Contains("student2@test.com", emails);
        Assert.DoesNotContain("admin@test.com", emails);
        Assert.DoesNotContain("teacher@test.com", emails);
    }
}

