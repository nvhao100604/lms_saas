using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Api.Controllers;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Members;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class MembersControllerTests
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
    public async Task GetTeachers_ShouldReturnOnlyActiveTeachersAndCenterAdmins()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = CreateInMemoryContext(dbName, tenantId);
        using (context)
        {
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center" };
            var userAdmin = new User { Id = Guid.NewGuid(), Email = "admin@test.com", FullName = "Admin User" };
            var userTeacher = new User { Id = Guid.NewGuid(), Email = "teacher@test.com", FullName = "Teacher User" };
            var userInactiveTeacher = new User { Id = Guid.NewGuid(), Email = "inactive@test.com", FullName = "Inactive Teacher" };
            var userStudent = new User { Id = Guid.NewGuid(), Email = "student@test.com", FullName = "Student User" };

            context.Tenants.Add(tenant);
            context.Users.AddRange(userAdmin, userTeacher, userInactiveTeacher, userStudent);

            context.TenantMembers.AddRange(
                new TenantMember { TenantId = tenantId, UserId = userAdmin.Id, Role = RoleInTenant.CenterAdmin, IsActive = true, User = userAdmin, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = userTeacher.Id, Role = RoleInTenant.Teacher, IsActive = true, User = userTeacher, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = userInactiveTeacher.Id, Role = RoleInTenant.Teacher, IsActive = false, User = userInactiveTeacher, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = userStudent.Id, Role = RoleInTenant.Student, IsActive = true, User = userStudent, Tenant = tenant }
            );

            await context.SaveChangesAsync();

            var controller = new MembersController(context, tenantService);

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

            var emails = response.Data.Select(t => t.Email).ToList();
            Assert.DoesNotContain("inactive@test.com", emails);
        }
    }

    [Fact]
    public async Task GetStudents_ShouldReturnOnlyActiveStudents()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = CreateInMemoryContext(dbName, tenantId);
        using (context)
        {
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center" };
            var userAdmin = new User { Id = Guid.NewGuid(), Email = "admin@test.com", FullName = "Admin User" };
            var userTeacher = new User { Id = Guid.NewGuid(), Email = "teacher@test.com", FullName = "Teacher User" };
            var userStudent1 = new User { Id = Guid.NewGuid(), Email = "student1@test.com", FullName = "Student One" };
            var userStudent2 = new User { Id = Guid.NewGuid(), Email = "student2@test.com", FullName = "Student Two" };
            var userInactiveStudent = new User { Id = Guid.NewGuid(), Email = "inactive.student@test.com", FullName = "Inactive Student" };

            context.Tenants.Add(tenant);
            context.Users.AddRange(userAdmin, userTeacher, userStudent1, userStudent2, userInactiveStudent);

            context.TenantMembers.AddRange(
                new TenantMember { TenantId = tenantId, UserId = userAdmin.Id, Role = RoleInTenant.CenterAdmin, IsActive = true, User = userAdmin, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = userTeacher.Id, Role = RoleInTenant.Teacher, IsActive = true, User = userTeacher, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = userStudent1.Id, Role = RoleInTenant.Student, IsActive = true, User = userStudent1, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = userStudent2.Id, Role = RoleInTenant.Student, IsActive = true, User = userStudent2, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = userInactiveStudent.Id, Role = RoleInTenant.Student, IsActive = false, User = userInactiveStudent, Tenant = tenant }
            );

            await context.SaveChangesAsync();

            var controller = new MembersController(context, tenantService);

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
            Assert.DoesNotContain("inactive.student@test.com", emails);
        }
    }

    [Fact]
    public async Task GetMembers_WithRoleAndSearchFilter_ReturnsFilteredMembers()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = CreateInMemoryContext(dbName, tenantId);
        using (context)
        {
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center" };
            var teacherAlice = new User { Id = Guid.NewGuid(), Email = "alice@test.com", FullName = "Alice Nguyen" };
            var teacherBob = new User { Id = Guid.NewGuid(), Email = "bob@test.com", FullName = "Bob Tran" };
            var studentCharlie = new User { Id = Guid.NewGuid(), Email = "charlie@test.com", FullName = "Charlie Pham" };

            context.Tenants.Add(tenant);
            context.Users.AddRange(teacherAlice, teacherBob, studentCharlie);

            context.TenantMembers.AddRange(
                new TenantMember { TenantId = tenantId, UserId = teacherAlice.Id, Role = RoleInTenant.Teacher, IsActive = true, User = teacherAlice, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = teacherBob.Id, Role = RoleInTenant.Teacher, IsActive = true, User = teacherBob, Tenant = tenant },
                new TenantMember { TenantId = tenantId, UserId = studentCharlie.Id, Role = RoleInTenant.Student, IsActive = true, User = studentCharlie, Tenant = tenant }
            );

            await context.SaveChangesAsync();

            var controller = new MembersController(context, tenantService);

            // Act: Filter by role Teacher and search "alice"
            var actionResult = await controller.GetMembers("Teacher", "alice");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<IReadOnlyList<TenantMemberResponse>>>(okResult.Value);
            Assert.True(response.Success);
            Assert.Single(response.Data!);
            Assert.Equal("alice@test.com", response.Data![0].Email);
            Assert.Equal("Alice Nguyen", response.Data![0].FullName);
        }
    }

    [Fact]
    public async Task CreateMember_Success_CreatesUserAndMembership()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = CreateInMemoryContext(dbName, tenantId);
        using (context)
        {
            var plan = new SubscriptionPlan
            {
                Id = Guid.NewGuid(),
                Code = "PRO",
                Name = "Gói Pro",
                MaxStudentsLimit = 100
            };
            var tenant = new Tenant
            {
                Id = tenantId,
                Name = "Test Center",
                Slug = "test-center",
                SubscriptionPlanId = plan.Id,
                SubscriptionPlan = plan
            };
            context.SubscriptionPlans.Add(plan);
            context.Tenants.Add(tenant);
            await context.SaveChangesAsync();

            var controller = new MembersController(context, tenantService);
            SetUserContext(controller, Guid.NewGuid(), "CenterAdmin");

            var request = new CreateTenantMemberRequest
            {
                FullName = "New Teacher",
                Email = "new.teacher@test.com",
                Role = RoleInTenant.Teacher,
                InitialPassword = "Password@123"
            };

            // Act
            var actionResult = await controller.CreateMember(request);

            // Assert
            var createdResult = Assert.IsType<ObjectResult>(actionResult);
            Assert.Equal(201, createdResult.StatusCode);

            var response = Assert.IsType<ApiResponse<TenantMemberResponse>>(createdResult.Value);
            Assert.True(response.Success);
            Assert.Equal("new.teacher@test.com", response.Data!.Email);
            Assert.Equal("New Teacher", response.Data.FullName);
            Assert.Equal(RoleInTenant.Teacher.ToString(), response.Data.Role);
            Assert.True(response.Data.IsActive);

            // Verify User exists in db
            var createdUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "new.teacher@test.com");
            Assert.NotNull(createdUser);
            Assert.Equal("Password@123", createdUser.PasswordHash);

            // Verify TenantMember exists in db
            var createdMember = await context.TenantMembers.FirstOrDefaultAsync(tm => tm.UserId == createdUser.Id);
            Assert.NotNull(createdMember);
            Assert.Equal(RoleInTenant.Teacher, createdMember.Role);
            Assert.True(createdMember.IsActive);
        }
    }

    [Fact]
    public async Task CreateMember_DuplicateEmailInSameTenant_ReturnsBadRequest()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = CreateInMemoryContext(dbName, tenantId);
        using (context)
        {
            var tenant = new Tenant { Id = tenantId, Name = "Test Center", Slug = "test-center" };
            var existingUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@test.com",
                FullName = "Existing User",
                PasswordHash = "Lms@123456"
            };

            context.Tenants.Add(tenant);
            context.Users.Add(existingUser);
            context.TenantMembers.Add(new TenantMember
            {
                TenantId = tenantId,
                UserId = existingUser.Id,
                Role = RoleInTenant.Student,
                IsActive = true
            });
            await context.SaveChangesAsync();

            var controller = new MembersController(context, tenantService);
            SetUserContext(controller, Guid.NewGuid(), "CenterAdmin");

            var request = new CreateTenantMemberRequest
            {
                FullName = "Duplicate User",
                Email = "existing@test.com",
                Role = RoleInTenant.Student
            };

            // Act
            var actionResult = await controller.CreateMember(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<TenantMemberResponse>>(badRequestResult.Value);
            Assert.False(response.Success);
            Assert.Equal("Thành viên với email này đã tồn tại trong trung tâm.", response.Message);
        }
    }

    [Fact]
    public async Task CreateMember_StudentQuotaExceeded_ReturnsBadRequest()
    {
        var tenantId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = CreateInMemoryContext(dbName, tenantId);
        using (context)
        {
            var plan = new SubscriptionPlan
            {
                Id = Guid.NewGuid(),
                Code = "BASIC",
                Name = "Gói Cơ Bản",
                MaxStudentsLimit = 2
            };
            var tenant = new Tenant
            {
                Id = tenantId,
                Name = "Test Center",
                Slug = "test-center",
                SubscriptionPlanId = plan.Id,
                SubscriptionPlan = plan
            };
            context.SubscriptionPlans.Add(plan);
            context.Tenants.Add(tenant);

            var s1 = new User { Id = Guid.NewGuid(), Email = "s1@test.com", FullName = "Student 1" };
            var s2 = new User { Id = Guid.NewGuid(), Email = "s2@test.com", FullName = "Student 2" };
            context.Users.AddRange(s1, s2);
            context.TenantMembers.AddRange(
                new TenantMember { TenantId = tenantId, UserId = s1.Id, Role = RoleInTenant.Student, IsActive = true },
                new TenantMember { TenantId = tenantId, UserId = s2.Id, Role = RoleInTenant.Student, IsActive = true }
            );
            await context.SaveChangesAsync();

            var controller = new MembersController(context, tenantService);
            SetUserContext(controller, Guid.NewGuid(), "CenterAdmin");

            var request = new CreateTenantMemberRequest
            {
                FullName = "Student 3",
                Email = "s3@test.com",
                Role = RoleInTenant.Student
            };

            // Act
            var actionResult = await controller.CreateMember(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<TenantMemberResponse>>(badRequestResult.Value);
            Assert.False(response.Success);
            Assert.Equal("Trung tâm đã đạt giới hạn tối đa 2 học viên của gói Gói Cơ Bản. Vui lòng nâng cấp gói cước.", response.Message);
        }
    }

    [Fact]
    public async Task PatchMember_SelfLockout_ReturnsBadRequest()
    {
        var tenantId = Guid.NewGuid();
        var adminUserId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = CreateInMemoryContext(dbName, tenantId, adminUserId);
        using (context)
        {
            var adminUser = new User { Id = adminUserId, Email = "admin@test.com", FullName = "Super Admin" };
            var adminMember = new TenantMember
            {
                Id = memberId,
                TenantId = tenantId,
                UserId = adminUserId,
                Role = RoleInTenant.CenterAdmin,
                IsActive = true,
                User = adminUser
            };

            context.Users.Add(adminUser);
            context.TenantMembers.Add(adminMember);
            await context.SaveChangesAsync();

            var controller = new MembersController(context, tenantService);
            SetUserContext(controller, adminUserId, "CenterAdmin");

            // Attempt 1: Demoting self to Teacher
            var patchDemote = new PatchTenantMemberRequest { Role = RoleInTenant.Teacher };
            var result1 = await controller.PatchMember(memberId, patchDemote);

            var badRequest1 = Assert.IsType<BadRequestObjectResult>(result1);
            var res1 = Assert.IsType<ApiResponse<TenantMemberResponse>>(badRequest1.Value);
            Assert.False(res1.Success);
            Assert.Equal("Bạn không thể tự hạ quyền quản trị hoặc tự khóa tài khoản của chính mình.", res1.Message);

            // Attempt 2: Deactivating self (IsActive = false)
            var patchDeactivate = new PatchTenantMemberRequest { IsActive = false };
            var result2 = await controller.PatchMember(memberId, patchDeactivate);

            var badRequest2 = Assert.IsType<BadRequestObjectResult>(result2);
            var res2 = Assert.IsType<ApiResponse<TenantMemberResponse>>(badRequest2.Value);
            Assert.False(res2.Success);
            Assert.Equal("Bạn không thể tự hạ quyền quản trị hoặc tự khóa tài khoản của chính mình.", res2.Message);
        }
    }

    [Fact]
    public async Task PatchMember_OtherMember_UpdatesSuccessfully()
    {
        var tenantId = Guid.NewGuid();
        var adminUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = CreateInMemoryContext(dbName, tenantId, adminUserId);
        using (context)
        {
            var otherUser = new User { Id = otherUserId, Email = "teacher@test.com", FullName = "Old Name" };
            var member = new TenantMember
            {
                Id = memberId,
                TenantId = tenantId,
                UserId = otherUserId,
                Role = RoleInTenant.Teacher,
                IsActive = true,
                User = otherUser
            };

            context.Users.Add(otherUser);
            context.TenantMembers.Add(member);
            await context.SaveChangesAsync();

            var controller = new MembersController(context, tenantService);
            SetUserContext(controller, adminUserId, "CenterAdmin");

            var patchRequest = new PatchTenantMemberRequest
            {
                FullName = "Updated Name",
                Role = RoleInTenant.CenterAdmin,
                IsActive = false
            };

            // Act
            var actionResult = await controller.PatchMember(memberId, patchRequest);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<TenantMemberResponse>>(okResult.Value);
            Assert.True(response.Success);
            Assert.Equal("Updated Name", response.Data!.FullName);
            Assert.Equal(RoleInTenant.CenterAdmin.ToString(), response.Data.Role);
            Assert.False(response.Data.IsActive);
        }
    }
}
