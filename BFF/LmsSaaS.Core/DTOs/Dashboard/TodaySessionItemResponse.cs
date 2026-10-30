using System;

namespace LmsSaaS.Core.DTOs.Dashboard;

public record TodaySessionItemResponse(
    Guid SessionId,
    Guid ClassId,
    string ClassName,
    string CourseTitle,
    string TeacherName,
    string? RoomName,
    int SessionNumber,
    string? Topic,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime
);
