using System;
using System.Collections.Generic;
using LmsSaaS.Core.Common;

namespace LmsSaaS.Core.Entities;

public class Quiz : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ClassId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTimeOffset Deadline { get; set; }
    public string QuestionsJson { get; set; } = "[]";

    public Class Class { get; set; } = null!;
    public ICollection<QuizSubmission> Submissions { get; set; } = new List<QuizSubmission>();
}
