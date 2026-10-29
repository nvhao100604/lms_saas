using System.ComponentModel.DataAnnotations;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.DTOs.Members;

public class CreateTenantMemberRequest
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public RoleInTenant Role { get; set; } = RoleInTenant.Student;

    [MinLength(6), MaxLength(100)]
    public string? InitialPassword { get; set; }
}

