using System;
using System.Collections.Generic;

namespace LmsSaaS.Core.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<TenantMember> TenantMembers { get; set; } = new List<TenantMember>();
    public ICollection<Class> ClassesAsTeacher { get; set; } = new List<Class>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<QuizSubmission> QuizSubmissions { get; set; } = new List<QuizSubmission>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
