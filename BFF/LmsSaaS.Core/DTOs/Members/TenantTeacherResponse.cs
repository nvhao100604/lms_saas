using System;

namespace LmsSaaS.Core.DTOs.Members;

public record TenantTeacherResponse(
    Guid UserId,
    string FullName,
    string Email,
    string Role
);
