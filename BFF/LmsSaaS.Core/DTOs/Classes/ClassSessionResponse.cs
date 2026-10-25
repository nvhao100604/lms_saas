using System;

namespace LmsSaaS.Core.DTOs.Classes;

public record ClassSessionResponse(
    Guid Id,
    int SessionNumber,
    string? Topic,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime
);
