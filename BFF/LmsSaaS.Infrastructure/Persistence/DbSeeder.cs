using System;
using System.Threading.Tasks;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // 0. Tạo 2 gói cước SubscriptionPlan (Gói hệ thống) nếu chưa có
        var freePlan = await context.SubscriptionPlans.IgnoreQueryFilters().FirstOrDefaultAsync(sp => sp.Code == "FREE");
        if (freePlan == null)
        {
            freePlan = new SubscriptionPlan
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Code = "FREE",
                Name = "Gói Miễn Phí",
                Price = 0m,
                MaxClassesLimit = 3,
                MaxStudentsPerClass = 20,
                MaxStudentsLimit = 20,
                IsActive = true
            };
            await context.SubscriptionPlans.AddAsync(freePlan);
        }

        var proPlan = await context.SubscriptionPlans.IgnoreQueryFilters().FirstOrDefaultAsync(sp => sp.Code == "PRO");
        if (proPlan == null)
        {
            proPlan = new SubscriptionPlan
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Code = "PRO",
                Name = "Gói Chuyên Nghiệp",
                Price = 500000m,
                MaxClassesLimit = 10,
                MaxStudentsPerClass = 50,
                MaxStudentsLimit = 100,
                IsActive = true
            };
            await context.SubscriptionPlans.AddAsync(proPlan);
        }

        await context.SaveChangesAsync();

        // Nếu đã có dữ liệu Tenant thì bỏ qua, không seed lại
        if (await context.Tenants.IgnoreQueryFilters().AnyAsync())
        {
            return;
        }

        // 1. Tạo 2 Tenants
        var tenantApex = new Tenant
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Anh Ngữ Apex",
            Slug = "apex-english",
            SubscriptionPlanId = proPlan.Id
        };

        var tenantCodePro = new Tenant
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "Học Viện CodePro",
            Slug = "codepro-academy",
            SubscriptionPlanId = freePlan.Id
        };

        await context.Tenants.AddRangeAsync(tenantApex, tenantCodePro);

        // 2. Tạo Users (Dùng mật khẩu hash mẫu đơn giản)
        var teacherJohn = new User
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Email = "john.teacher@apex.edu.vn",
            FullName = "John Smith",
            PasswordHash = "hashed_password_sample"
        };

        var teacherDavid = new User
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Email = "david.tech@codepro.vn",
            FullName = "David Nguyen",
            PasswordHash = "hashed_password_sample"
        };

        await context.Users.AddRangeAsync(teacherJohn, teacherDavid);

        // 3. Phân quyền thành viên (TenantMembers)
        var memberApex = new TenantMember
        {
            TenantId = tenantApex.Id,
            UserId = teacherJohn.Id,
            Role = RoleInTenant.Teacher
        };

        var memberCodePro = new TenantMember
        {
            TenantId = tenantCodePro.Id,
            UserId = teacherDavid.Id,
            Role = RoleInTenant.Teacher
        };

        await context.TenantMembers.AddRangeAsync(memberApex, memberCodePro);

        // 4. Tạo Khóa học & Lớp học cho Apex
        var courseIelts = new Course
        {
            Id = Guid.NewGuid(),
            TenantId = tenantApex.Id,
            Title = "IELTS Intensive 6.5+",
            Description = "Luyện thi cấp tốc",
            TuitionFee = 6500000m,
            IsActive = true
        };

        var classIelts = new Class
        {
            Id = Guid.NewGuid(),
            TenantId = tenantApex.Id,
            CourseId = courseIelts.Id,
            TeacherId = teacherJohn.Id,
            Name = "Lớp IELTS Tối 2-4-6",
            RoomName = "Phòng Lab A1",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2)),
            MaxCapacity = 20,
            Status = ClassStatus.Ongoing
        };

        // 5. Tạo Khóa học & Lớp học cho CodePro
        var courseDotNet = new Course
        {
            Id = Guid.NewGuid(),
            TenantId = tenantCodePro.Id,
            Title = "Lập trình C# ASP.NET Core",
            Description = "Backend thực chiến",
            TuitionFee = 8000000m,
            IsActive = true
        };

        var classDotNet = new Class
        {
            Id = Guid.NewGuid(),
            TenantId = tenantCodePro.Id,
            CourseId = courseDotNet.Id,
            TeacherId = teacherDavid.Id,
            Name = "Lớp .NET Core Tối 3-5-7",
            RoomName = "Google Meet Online",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(3)),
            MaxCapacity = 25,
            Status = ClassStatus.Ongoing
        };

        await context.Courses.AddRangeAsync(courseIelts, courseDotNet);
        await context.Classes.AddRangeAsync(classIelts, classDotNet);

        // Lưu toàn bộ dữ liệu seed
        await context.SaveChangesAsync();
    }
}
