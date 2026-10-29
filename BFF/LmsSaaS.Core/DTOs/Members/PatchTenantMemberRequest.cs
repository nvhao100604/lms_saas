using System.ComponentModel.DataAnnotations;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.DTOs.Members;

public class PatchTenantMemberRequest
{
    [MaxLength(150)]
    public string? FullName { get; set; }

    public RoleInTenant? Role { get; set; }

    public bool? IsActive { get; set; }
}

