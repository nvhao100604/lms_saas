using System;

namespace LmsSaaS.Core.DTOs.Schedule;

public record ScheduleSessionResponse(
    Guid SessionId,
    Guid ClassId,
    string ClassName,
    Guid CourseId,
    string CourseTitle,
    Guid TeacherId,
    string TeacherName,
    string? RoomName,
    int SessionNumber,
    string? Topic,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    string ClassStatus,
    string? MyAttendanceStatus = null
);
