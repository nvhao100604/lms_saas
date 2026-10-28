using System;

namespace LmsSaaS.Core.DTOs.Members;

public record TenantStudentResponse(
    Guid UserId,
    string FullName,
    string Email
);
