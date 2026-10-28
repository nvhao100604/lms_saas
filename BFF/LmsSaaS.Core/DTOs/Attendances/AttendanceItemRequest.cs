using System;
using System.ComponentModel.DataAnnotations;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.DTOs.Attendances;

public class AttendanceItemRequest
{
    [Required]
    public Guid StudentId { get; set; }

    [Required]
    public AttendanceStatus Status { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}
