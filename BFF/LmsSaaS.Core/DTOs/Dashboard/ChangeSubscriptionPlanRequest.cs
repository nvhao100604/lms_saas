using System;
using System.ComponentModel.DataAnnotations;

namespace LmsSaaS.Core.DTOs.Dashboard;

public class ChangeSubscriptionPlanRequest
{
    [Required]
    public Guid PlanId { get; set; }
}

