using System.ComponentModel.DataAnnotations;
using LmsSaaS.Core.Enums;

namespace LmsSaaS.Core.DTOs.Classes;

public class PatchClassRequest
{
    [MaxLength(150)]
    [MinLength(1)]
    public string? Name { get; set; }

    [MaxLength(100)]
    public string? RoomName { get; set; }

    [Range(1, 500)]
    public int? MaxCapacity { get; set; }

    public ClassStatus? Status { get; set; }
}
