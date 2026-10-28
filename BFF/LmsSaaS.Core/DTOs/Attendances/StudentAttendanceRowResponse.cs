using System;

namespace LmsSaaS.Core.DTOs.Attendances;

public record StudentAttendanceRowResponse(
    Guid StudentId,
    string StudentName,
    string StudentEmail,
    string Status,
    string? Note,
    bool IsRecorded
);
