using LmsSaaS.Core.Common;
using LmsSaaS.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Reflection;

namespace LmsSaaS.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    private readonly ICurrentTenantService? _currentTenantService;

    // EF Core sẽ đọc giá trị này ở mỗi câu query để áp dụng vào bộ lọc
    public Guid? CurrentTenantId => _currentTenantService?.TenantId;


    // 1. Constructor chính nhận ICurrentTenantService (dùng lúc app chạy thật)
    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        ICurrentTenantService? currentTenantService) : base(options)
    {
        _currentTenantService = currentTenantService;
    }

    // 2. Constructor phụ không tham số ICurrentTenantService (dùng khi chạy lệnh dotnet ef CLI)
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }


    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<TenantMember> TenantMembers => Set<TenantMember>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<ClassSession> ClassSessions => Set<ClassSession>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<ClassMaterial> ClassMaterials => Set<ClassMaterial>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizSubmission> QuizSubmissions => Set<QuizSubmission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =========================================================================
        // A. CƠ CHẾ REFLECTION: Tự động gắn Query Filter cho mọi bảng ITenantEntity
        // =========================================================================
        var applyFilterMethod = typeof(AppDbContext)
            .GetMethod(nameof(ConfigureTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                applyFilterMethod?
                    .MakeGenericMethod(entityType.ClrType)
                    .Invoke(this, new object[] { modelBuilder });
            }
        }

        // =========================================================================
        // B. CẤU HÌNH FLUENT API CHO CÁC BẢNG
        // =========================================================================

        // 0. SubscriptionPlan (Bảng cấp hệ thống - không kế thừa ITenantEntity)
        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.HasKey(sp => sp.Id);
            entity.Property(sp => sp.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(sp => sp.Code).IsUnique();
            entity.Property(sp => sp.Name).IsRequired().HasMaxLength(150);
            entity.Property(sp => sp.Price).HasPrecision(18, 2);
        });

        // 1. Tenant
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Name).IsRequired().HasMaxLength(200);
            entity.Property(t => t.Slug).IsRequired().HasMaxLength(100);
            entity.HasIndex(t => t.Slug).IsUnique();

            entity.HasOne(t => t.SubscriptionPlan)
                .WithMany(sp => sp.Tenants)
                .HasForeignKey(t => t.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 2. User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(200);
            entity.Property(u => u.PhoneNumber).HasMaxLength(50);
        });

        // 3. TenantMember (ITenantEntity)
        modelBuilder.Entity<TenantMember>(entity =>
        {
            entity.HasKey(tm => tm.Id);
            entity.HasIndex(tm => new { tm.TenantId, tm.UserId }).IsUnique();

            entity.Property(tm => tm.Role)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasOne(tm => tm.Tenant)
                .WithMany(t => t.TenantMembers)
                .HasForeignKey(tm => tm.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tm => tm.User)
                .WithMany(u => u.TenantMembers)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 4. Course (ITenantEntity)
        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Title).IsRequired().HasMaxLength(200);
            entity.Property(c => c.TuitionFee)
                .HasPrecision(18, 2);

            entity.HasOne(c => c.Tenant)
                .WithMany()
                .HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 5. Class (ITenantEntity)
        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
            entity.Property(c => c.RoomName).HasMaxLength(100);

            entity.Property(c => c.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasOne(c => c.Tenant)
                .WithMany()
                .HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Course)
                .WithMany(co => co.Classes)
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Teacher)
                .WithMany(u => u.ClassesAsTeacher)
                .HasForeignKey(c => c.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 6. ClassSession (ITenantEntity)
        modelBuilder.Entity<ClassSession>(entity =>
        {
            entity.HasKey(cs => cs.Id);
            entity.Property(cs => cs.Topic).HasMaxLength(255);

            entity.HasOne(cs => cs.Class)
                .WithMany(c => c.Sessions)
                .HasForeignKey(cs => cs.ClassId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 7. Enrollment (ITenantEntity)
        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ClassId, e.StudentId }).IsUnique();

            entity.Property(e => e.TuitionStatus)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasOne(e => e.Class)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Student)
                .WithMany(u => u.Enrollments)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 8. Attendance (ITenantEntity)
        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.TeacherNote).HasMaxLength(500);

            entity.Property(a => a.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasOne(a => a.ClassSession)
                .WithMany(cs => cs.Attendances)
                .HasForeignKey(a => a.ClassSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Student)
                .WithMany(u => u.Attendances)
                .HasForeignKey(a => a.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 9. ClassMaterial (ITenantEntity)
        modelBuilder.Entity<ClassMaterial>(entity =>
        {
            entity.HasKey(cm => cm.Id);
            entity.Property(cm => cm.Title).IsRequired().HasMaxLength(255);
            entity.Property(cm => cm.FileUrl).IsRequired().HasMaxLength(2000);

            entity.HasOne(cm => cm.Class)
                .WithMany(c => c.Materials)
                .HasForeignKey(cm => cm.ClassId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 10. Quiz (ITenantEntity)
        modelBuilder.Entity<Quiz>(entity =>
        {
            entity.HasKey(q => q.Id);
            entity.Property(q => q.Title).IsRequired().HasMaxLength(255);
            entity.Property(q => q.QuestionsJson)
                .HasColumnType("jsonb")
                .IsRequired();

            entity.HasOne(q => q.Class)
                .WithMany(c => c.Quizzes)
                .HasForeignKey(q => q.ClassId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 11. QuizSubmission (ITenantEntity)
        modelBuilder.Entity<QuizSubmission>(entity =>
        {
            entity.HasKey(qs => qs.Id);
            entity.Property(qs => qs.AnswersJson)
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(qs => qs.Score)
                .HasPrecision(5, 2);

            entity.HasOne(qs => qs.Quiz)
                .WithMany(q => q.Submissions)
                .HasForeignKey(qs => qs.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(qs => qs.Student)
                .WithMany(u => u.QuizSubmissions)
                .HasForeignKey(qs => qs.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

// Phương thức private hỗ trợ Reflection áp dụng Query Filter
    private void ConfigureTenantFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : class, ITenantEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
    }

    // Tự động gán TenantId khi INSERT dữ liệu
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
            {
                if (CurrentTenantId.HasValue)
                {
                    entry.Entity.TenantId = CurrentTenantId.Value;
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
