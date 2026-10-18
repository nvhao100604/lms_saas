using System;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.Entities;

public class Attendance : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ClassSessionId { get; set; }
    public Guid StudentId { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string? TeacherNote { get; set; }

    public ClassSession ClassSession { get; set; } = null!;
    public User Student { get; set; } = null!;
}
