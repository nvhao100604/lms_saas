using System;

namespace LmsSaaS.Core.DTOs.Members;

public record TenantMemberResponse(
    Guid MemberId,
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    DateTimeOffset JoinedAt
);

