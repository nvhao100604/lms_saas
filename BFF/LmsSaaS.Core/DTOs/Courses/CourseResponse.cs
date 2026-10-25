using System;

namespace LmsSaaS.Core.DTOs.Courses;

public record CourseResponse(
    Guid Id,
    string Title,
    string? Description,
    decimal TuitionFee,
    bool IsActive,
    DateTimeOffset CreatedAt
);
