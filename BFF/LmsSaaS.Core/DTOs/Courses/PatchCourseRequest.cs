using System.ComponentModel.DataAnnotations;

namespace LmsSaaS.Core.DTOs.Courses;

public class PatchCourseRequest
{
    [MaxLength(200)]
    [MinLength(1)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? TuitionFee { get; set; }

    public bool? IsActive { get; set; }
}
