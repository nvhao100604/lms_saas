using System;
using System.Collections.Generic;
using LmsSaaS.Core.Common;

namespace LmsSaaS.Core.Entities;

public class ClassSession : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ClassId { get; set; }
    public int SessionNumber { get; set; }
    public string Topic { get; set; } = string.Empty;
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }

    public Class Class { get; set; } = null!;
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
