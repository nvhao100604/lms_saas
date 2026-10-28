using System;

namespace LmsSaaS.Core.DTOs.Classes;

public record ClassEnrollmentResponse(
    Guid EnrollmentId,
    Guid StudentId,
    string StudentName,
    string StudentEmail,
    DateTimeOffset EnrolledAt
);
