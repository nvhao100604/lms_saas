using System;
using System.Collections.Generic;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.Entities;

public class Class : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid CourseId { get; set; }
    public Guid TeacherId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int MaxCapacity { get; set; }
    public ClassStatus Status { get; set; } = ClassStatus.Upcoming;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public User Teacher { get; set; } = null!;
    public ICollection<ClassSession> Sessions { get; set; } = new List<ClassSession>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<ClassMaterial> Materials { get; set; } = new List<ClassMaterial>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
