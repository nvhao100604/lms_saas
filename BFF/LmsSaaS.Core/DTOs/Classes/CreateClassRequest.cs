using System;
using System.ComponentModel.DataAnnotations;

namespace LmsSaaS.Core.DTOs.Classes;

public class CreateClassRequest
{
    [Required]
    public Guid CourseId { get; set; }

    [Required]
    public Guid TeacherId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? RoomName { get; set; }

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    [Range(1, 500)]
    public int MaxCapacity { get; set; } = 30;

    [Required]
    public ClassScheduleConfigRequest Schedule { get; set; } = null!;
}
