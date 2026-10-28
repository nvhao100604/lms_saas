using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace LmsSaaS.Core.DTOs.Attendances;

public class SaveSessionAttendanceRequest
{
    [MaxLength(250)]
    public string? Topic { get; set; }

    public List<AttendanceItemRequest> Attendances { get; set; } = new();
}
