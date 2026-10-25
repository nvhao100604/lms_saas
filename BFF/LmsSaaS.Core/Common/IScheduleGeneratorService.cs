using System;
using System.Collections.Generic;
using LmsSaaS.Core.DTOs.Classes;
using LmsSaaS.Core.Entities;

namespace LmsSaaS.Core.Common;

public interface IScheduleGeneratorService
{
    List<ClassSession> GenerateSessions(
        Guid tenantId,
        Guid classId,
        DateOnly startDate,
        DateOnly endDate,
        ClassScheduleConfigRequest schedule);
}
