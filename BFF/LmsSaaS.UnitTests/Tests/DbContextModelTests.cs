using System;
using System.Linq;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Entities;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class DbContextModelTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=testdb;Username=postgres;Password=postgres")
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public void ModelBuilder_ShouldRegisterAll13Entities()
    {
        using var context = CreateContext();
        var model = context.Model;

        var entityTypes = model.GetEntityTypes().Select(e => e.ClrType).ToList();

        Assert.Contains(typeof(SubscriptionPlan), entityTypes);
        Assert.Contains(typeof(Tenant), entityTypes);
        Assert.Contains(typeof(User), entityTypes);
        Assert.Contains(typeof(TenantMember), entityTypes);
        Assert.Contains(typeof(Course), entityTypes);
        Assert.Contains(typeof(Class), entityTypes);
        Assert.Contains(typeof(ClassSession), entityTypes);
        Assert.Contains(typeof(Enrollment), entityTypes);
        Assert.Contains(typeof(Attendance), entityTypes);
        Assert.Contains(typeof(ClassMaterial), entityTypes);
        Assert.Contains(typeof(Quiz), entityTypes);
        Assert.Contains(typeof(QuizSubmission), entityTypes);
        Assert.Contains(typeof(RefreshToken), entityTypes);
    }

    [Fact]
    public void TenantEntities_ShouldImplementITenantEntity()
    {
        var tenantEntityTypes = new[]
        {
            typeof(TenantMember),
            typeof(Course),
            typeof(Class),
            typeof(ClassSession),
            typeof(Enrollment),
            typeof(Attendance),
            typeof(ClassMaterial),
            typeof(Quiz),
            typeof(QuizSubmission),
            typeof(RefreshToken)
        };

        foreach (var type in tenantEntityTypes)
        {
            Assert.True(typeof(ITenantEntity).IsAssignableFrom(type), $"{type.Name} should implement ITenantEntity");
        }

        // Bảng cấp hệ thống không được kế thừa ITenantEntity
        Assert.False(typeof(ITenantEntity).IsAssignableFrom(typeof(SubscriptionPlan)), "SubscriptionPlan should NOT implement ITenantEntity");
        Assert.False(typeof(ITenantEntity).IsAssignableFrom(typeof(Tenant)), "Tenant should NOT implement ITenantEntity");
        Assert.False(typeof(ITenantEntity).IsAssignableFrom(typeof(User)), "User should NOT implement ITenantEntity");
    }

    [Fact]
    public void ModelBuilder_ShouldConfigureUniqueIndexes()
    {
        using var context = CreateContext();
        var model = context.Model;

        // SubscriptionPlan.Code Unique
        var spEntity = model.FindEntityType(typeof(SubscriptionPlan));
        var codeIndex = spEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(SubscriptionPlan.Code)));
        Assert.NotNull(codeIndex);
        Assert.True(codeIndex.IsUnique);

        // Tenant.Slug Unique
        var tenantEntity = model.FindEntityType(typeof(Tenant));
        var slugIndex = tenantEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Tenant.Slug)));
        Assert.NotNull(slugIndex);
        Assert.True(slugIndex.IsUnique);

        // User.Email Unique
        var userEntity = model.FindEntityType(typeof(User));
        var emailIndex = userEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(User.Email)));
        Assert.NotNull(emailIndex);
        Assert.True(emailIndex.IsUnique);

        // TenantMember(TenantId, UserId) Unique
        var tmEntity = model.FindEntityType(typeof(TenantMember));
        var tmIndex = tmEntity?.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 2 &&
            i.Properties.Any(p => p.Name == nameof(TenantMember.TenantId)) &&
            i.Properties.Any(p => p.Name == nameof(TenantMember.UserId)));
        Assert.NotNull(tmIndex);
        Assert.True(tmIndex.IsUnique);

        // Enrollment(ClassId, StudentId) Unique
        var enrollmentEntity = model.FindEntityType(typeof(Enrollment));
        var enrollmentIndex = enrollmentEntity?.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 2 &&
            i.Properties.Any(p => p.Name == nameof(Enrollment.ClassId)) &&
            i.Properties.Any(p => p.Name == nameof(Enrollment.StudentId)));
        Assert.NotNull(enrollmentIndex);
        Assert.True(enrollmentIndex.IsUnique);

        // RefreshToken.Token Unique
        var rtEntity = model.FindEntityType(typeof(RefreshToken));
        var tokenIndex = rtEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(RefreshToken.Token)));
        Assert.NotNull(tokenIndex);
        Assert.True(tokenIndex.IsUnique);
    }

    [Fact]
    public void ModelBuilder_ShouldConfigureJsonbColumnTypes()
    {
        using var context = CreateContext();
        var model = context.Model;

        var quizEntity = model.FindEntityType(typeof(Quiz));
        var questionsProp = quizEntity?.FindProperty(nameof(Quiz.QuestionsJson));
        Assert.Equal("jsonb", questionsProp?.GetColumnType());

        var submissionEntity = model.FindEntityType(typeof(QuizSubmission));
        var answersProp = submissionEntity?.FindProperty(nameof(QuizSubmission.AnswersJson));
        Assert.Equal("jsonb", answersProp?.GetColumnType());
    }

    [Fact]
    public void ModelBuilder_ShouldConfigureDecimalPrecision()
    {
        using var context = CreateContext();
        var model = context.Model;

        var spEntity = model.FindEntityType(typeof(SubscriptionPlan));
        var priceProp = spEntity?.FindProperty(nameof(SubscriptionPlan.Price));
        Assert.Equal(18, priceProp?.GetPrecision());
        Assert.Equal(2, priceProp?.GetScale());

        var courseEntity = model.FindEntityType(typeof(Course));
        var tuitionFeeProp = courseEntity?.FindProperty(nameof(Course.TuitionFee));
        Assert.Equal(18, tuitionFeeProp?.GetPrecision());
        Assert.Equal(2, tuitionFeeProp?.GetScale());

        var submissionEntity = model.FindEntityType(typeof(QuizSubmission));
        var scoreProp = submissionEntity?.FindProperty(nameof(QuizSubmission.Score));
        Assert.Equal(5, scoreProp?.GetPrecision());
        Assert.Equal(2, scoreProp?.GetScale());
    }

    [Fact]
    public void ModelBuilder_ShouldConfigureUserForeignKeyDeleteBehaviorRestrict()
    {
        using var context = CreateContext();
        var model = context.Model;

        // Class.Teacher -> User (Restrict)
        var classEntity = model.FindEntityType(typeof(Class));
        var teacherFk = classEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == nameof(Class.TeacherId)));
        Assert.Equal(DeleteBehavior.Restrict, teacherFk?.DeleteBehavior);

        // Enrollment.Student -> User (Restrict)
        var enrollmentEntity = model.FindEntityType(typeof(Enrollment));
        var studentFk = enrollmentEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == nameof(Enrollment.StudentId)));
        Assert.Equal(DeleteBehavior.Restrict, studentFk?.DeleteBehavior);

        // Attendance.Student -> User (Restrict)
        var attendanceEntity = model.FindEntityType(typeof(Attendance));
        var attendanceStudentFk = attendanceEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == nameof(Attendance.StudentId)));
        Assert.Equal(DeleteBehavior.Restrict, attendanceStudentFk?.DeleteBehavior);

        // QuizSubmission.Student -> User (Restrict)
        var submissionEntity = model.FindEntityType(typeof(QuizSubmission));
        var submissionStudentFk = submissionEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == nameof(QuizSubmission.StudentId)));
        Assert.Equal(DeleteBehavior.Restrict, submissionStudentFk?.DeleteBehavior);

        // TenantMember.User -> User (Restrict)
        var tmEntity = model.FindEntityType(typeof(TenantMember));
        var tmUserFk = tmEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == nameof(TenantMember.UserId)));
        Assert.Equal(DeleteBehavior.Restrict, tmUserFk?.DeleteBehavior);

        // RefreshToken.User -> User (Restrict)
        var rtEntity = model.FindEntityType(typeof(RefreshToken));
        var rtUserFk = rtEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == nameof(RefreshToken.UserId)));
        Assert.Equal(DeleteBehavior.Restrict, rtUserFk?.DeleteBehavior);
    }

    [Fact]
    public void ModelBuilder_ShouldConfigureTenantSubscriptionPlanForeignKeyRestrict()
    {
        using var context = CreateContext();
        var model = context.Model;

        var tenantEntity = model.FindEntityType(typeof(Tenant));
        var spFk = tenantEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == nameof(Tenant.SubscriptionPlanId)));
        Assert.NotNull(spFk);
        Assert.Equal(DeleteBehavior.Restrict, spFk.DeleteBehavior);
        Assert.Equal(typeof(SubscriptionPlan), spFk.PrincipalEntityType.ClrType);
    }

    [Fact]
    public void ModelBuilder_SubscriptionPlan_ShouldNotHaveTenantQueryFilter()
    {
        using var context = CreateContext();
        var model = context.Model;

        var spEntity = model.FindEntityType(typeof(SubscriptionPlan));
        Assert.NotNull(spEntity);
        Assert.Empty(spEntity.GetDeclaredQueryFilters());

        var tenantEntity = model.FindEntityType(typeof(Tenant));
        Assert.NotNull(tenantEntity);
        Assert.Empty(tenantEntity.GetDeclaredQueryFilters());

        var userEntity = model.FindEntityType(typeof(User));
        Assert.NotNull(userEntity);
        Assert.Empty(userEntity.GetDeclaredQueryFilters());

        // Bảng ITenantEntity (như Course, RefreshToken) thì PHẢI có Query Filter
        var courseEntity = model.FindEntityType(typeof(Course));
        Assert.NotNull(courseEntity);
        Assert.NotEmpty(courseEntity.GetDeclaredQueryFilters());

        var rtEntity = model.FindEntityType(typeof(RefreshToken));
        Assert.NotNull(rtEntity);
        Assert.NotEmpty(rtEntity.GetDeclaredQueryFilters());
    }
}
