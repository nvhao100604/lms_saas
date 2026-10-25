using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace LmsSaaS.Core.DTOs.Classes;

public class ClassScheduleConfigRequest
{
    [Required]
    public List<DayOfWeek> DaysOfWeek { get; set; } = [];

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }
}
