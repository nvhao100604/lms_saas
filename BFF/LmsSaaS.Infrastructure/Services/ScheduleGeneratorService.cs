using System;
using System.Collections.Generic;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Classes;
using LmsSaaS.Core.Entities;

namespace LmsSaaS.Infrastructure.Services;

public class ScheduleGeneratorService : IScheduleGeneratorService
{
    public List<ClassSession> GenerateSessions(
        Guid tenantId,
        Guid classId,
        DateOnly startDate,
        DateOnly endDate,
        ClassScheduleConfigRequest schedule)
    {
        ArgumentNullException.ThrowIfNull(schedule);

        if (startDate > endDate)
        {
            throw new ArgumentException("StartDate must be before or equal to EndDate.", nameof(startDate));
        }

        if (schedule.StartTime >= schedule.EndTime)
        {
            throw new ArgumentException("StartTime must be strictly before EndTime.", nameof(schedule));
        }

        if (schedule.DaysOfWeek == null || schedule.DaysOfWeek.Count == 0)
        {
            throw new ArgumentException("At least one DayOfWeek must be configured in schedule.", nameof(schedule));
        }

        var sessions = new List<ClassSession>();
        var sessionNumber = 1;

        for (var current = startDate; current <= endDate; current = current.AddDays(1))
        {
            if (schedule.DaysOfWeek.Contains(current.DayOfWeek))
            {
                var startDateTime = current.ToDateTime(schedule.StartTime, DateTimeKind.Utc);
                var endDateTime = current.ToDateTime(schedule.EndTime, DateTimeKind.Utc);

                sessions.Add(new ClassSession
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    ClassId = classId,
                    SessionNumber = sessionNumber++,
                    Topic = $"Buổi {sessionNumber - 1}",
                    StartTime = new DateTimeOffset(startDateTime, TimeSpan.Zero),
                    EndTime = new DateTimeOffset(endDateTime, TimeSpan.Zero)
                });
            }
        }

        return sessions;
    }
}
