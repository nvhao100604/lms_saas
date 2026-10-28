using System;
using System.Collections.Generic;

namespace LmsSaaS.Core.DTOs.Attendances;

public record SessionAttendanceSheetResponse(
    Guid SessionId,
    Guid ClassId,
    string ClassName,
    string CourseTitle,
    string TeacherName,
    int SessionNumber,
    string? Topic,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int TotalStudents,
    int PresentCount,
    int AbsentCount,
    int LateCount,
    int ExcusedCount,
    IReadOnlyList<StudentAttendanceRowResponse> Students
);
