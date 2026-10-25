using System;
using System.Collections.Generic;

namespace LmsSaaS.Core.DTOs.Classes;

public record ClassResponse(
    Guid Id,
    Guid CourseId,
    string CourseTitle,
    Guid TeacherId,
    string TeacherName,
    string Name,
    string? RoomName,
    DateOnly StartDate,
    DateOnly EndDate,
    int MaxCapacity,
    string Status,
    int TotalSessions,
    IReadOnlyList<ClassSessionResponse>? Sessions = null
);
