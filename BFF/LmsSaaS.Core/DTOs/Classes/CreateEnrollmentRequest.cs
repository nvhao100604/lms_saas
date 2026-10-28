using System;
using System.ComponentModel.DataAnnotations;

namespace LmsSaaS.Core.DTOs.Classes;

public class CreateEnrollmentRequest
{
    [Required]
    public Guid StudentId { get; set; }
}
