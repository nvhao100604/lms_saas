using System.ComponentModel.DataAnnotations;

namespace LmsSaaS.Core.DTOs.Courses;

public class CreateCourseRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue)]
    public decimal TuitionFee { get; set; }
}
