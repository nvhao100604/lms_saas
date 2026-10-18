using System;
using LmsSaaS.Core.Common;

namespace LmsSaaS.Core.Entities;

public class ClassMaterial : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ClassId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;

    public Class Class { get; set; } = null!;
}
