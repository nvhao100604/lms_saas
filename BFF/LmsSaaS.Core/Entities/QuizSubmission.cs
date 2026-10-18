using System;
using LmsSaaS.Core.Common;

namespace LmsSaaS.Core.Entities;

public class QuizSubmission : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid QuizId { get; set; }
    public Guid StudentId { get; set; }
    public string AnswersJson { get; set; } = "{}";
    public decimal Score { get; set; }
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;

    public Quiz Quiz { get; set; } = null!;
    public User Student { get; set; } = null!;
}
