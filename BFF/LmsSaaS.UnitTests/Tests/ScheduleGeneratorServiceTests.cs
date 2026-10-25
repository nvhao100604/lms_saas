using System;
using System.Collections.Generic;
using System.Linq;
using LmsSaaS.Core.DTOs.Classes;
using LmsSaaS.Core.Entities;
using LmsSaaS.Infrastructure.Services;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class ScheduleGeneratorServiceTests
{
    private readonly ScheduleGeneratorService _service = new();

    [Fact]
    public void GenerateSessions_WithValidMondayWednesdayFridaySchedule_ShouldGenerateCorrectSessionCountAndSequentialNumbers()
    {
        // Arrange: 2 weeks from Monday 2026-11-02 to Sunday 2026-11-15
        var tenantId = Guid.NewGuid();
        var classId = Guid.NewGuid();
        var startDate = new DateOnly(2026, 11, 2); // Monday
        var endDate = new DateOnly(2026, 11, 15);  // Sunday
        var schedule = new ClassScheduleConfigRequest
        {
            DaysOfWeek = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
            StartTime = new TimeOnly(18, 30),
            EndTime = new TimeOnly(20, 30)
        };

        // Act
        var sessions = _service.GenerateSessions(tenantId, classId, startDate, endDate, schedule);

        // Assert: 2 Mon, 2 Wed, 2 Fri = 6 sessions
        Assert.Equal(6, sessions.Count);

        for (var i = 0; i < sessions.Count; i++)
        {
            var session = sessions[i];
            Assert.Equal(i + 1, session.SessionNumber);
            Assert.Equal(tenantId, session.TenantId);
            Assert.Equal(classId, session.ClassId);
            Assert.Contains(session.StartTime.DayOfWeek, schedule.DaysOfWeek);
            Assert.Equal(new TimeOnly(18, 30), TimeOnly.FromDateTime(session.StartTime.UtcDateTime));
            Assert.Equal(new TimeOnly(20, 30), TimeOnly.FromDateTime(session.EndTime.UtcDateTime));
            Assert.True(session.EndTime > session.StartTime);
            Assert.Equal(TimeSpan.Zero, session.StartTime.Offset);
        }
    }

    [Fact]
    public void GenerateSessions_WhenStartDateGreaterThanEndDate_ShouldThrowArgumentException()
    {
        var schedule = new ClassScheduleConfigRequest
        {
            DaysOfWeek = [DayOfWeek.Tuesday],
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(11, 0)
        };

        var ex = Assert.Throws<ArgumentException>(() =>
            _service.GenerateSessions(
                Guid.NewGuid(),
                Guid.NewGuid(),
                new DateOnly(2026, 12, 1),
                new DateOnly(2026, 11, 1),
                schedule));

        Assert.Contains("StartDate must be before or equal to EndDate", ex.Message);
    }

    [Fact]
    public void GenerateSessions_WhenStartTimeIsGreaterThanOrEqualToEndTime_ShouldThrowArgumentException()
    {
        var schedule = new ClassScheduleConfigRequest
        {
            DaysOfWeek = [DayOfWeek.Tuesday],
            StartTime = new TimeOnly(15, 0),
            EndTime = new TimeOnly(14, 0)
        };

        var ex = Assert.Throws<ArgumentException>(() =>
            _service.GenerateSessions(
                Guid.NewGuid(),
                Guid.NewGuid(),
                new DateOnly(2026, 11, 1),
                new DateOnly(2026, 11, 30),
                schedule));

        Assert.Contains("StartTime must be strictly before EndTime", ex.Message);
    }

    [Fact]
    public void GenerateSessions_WhenDaysOfWeekIsEmpty_ShouldThrowArgumentException()
    {
        var schedule = new ClassScheduleConfigRequest
        {
            DaysOfWeek = [],
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(11, 0)
        };

        var ex = Assert.Throws<ArgumentException>(() =>
            _service.GenerateSessions(
                Guid.NewGuid(),
                Guid.NewGuid(),
                new DateOnly(2026, 11, 1),
                new DateOnly(2026, 11, 30),
                schedule));

        Assert.Contains("At least one DayOfWeek must be configured", ex.Message);
    }

    [Fact]
    public void GenerateSessions_WhenNoDaysMatchInRange_ShouldReturnEmptyList()
    {
        // 2026-11-07 is Saturday, 2026-11-08 is Sunday
        var startDate = new DateOnly(2026, 11, 7);
        var endDate = new DateOnly(2026, 11, 8);
        var schedule = new ClassScheduleConfigRequest
        {
            DaysOfWeek = [DayOfWeek.Monday],
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(11, 0)
        };

        var sessions = _service.GenerateSessions(Guid.NewGuid(), Guid.NewGuid(), startDate, endDate, schedule);

        Assert.Empty(sessions);
    }

    [Theory]
    [InlineData("2026-11-02T08:00:00Z", "2026-11-02T10:00:00Z", "2026-11-02T09:00:00Z", "2026-11-02T11:00:00Z", true)]  // Giao thoa cuối
    [InlineData("2026-11-02T09:00:00Z", "2026-11-02T11:00:00Z", "2026-11-02T08:00:00Z", "2026-11-02T10:00:00Z", true)]  // Giao thoa đầu
    [InlineData("2026-11-02T08:30:00Z", "2026-11-02T09:30:00Z", "2026-11-02T08:00:00Z", "2026-11-02T10:00:00Z", true)]  // Nằm trọn bên trong
    [InlineData("2026-11-02T07:00:00Z", "2026-11-02T11:00:00Z", "2026-11-02T08:00:00Z", "2026-11-02T10:00:00Z", true)]  // Bao bọc toàn bộ
    [InlineData("2026-11-02T06:00:00Z", "2026-11-02T08:00:00Z", "2026-11-02T08:00:00Z", "2026-11-02T10:00:00Z", false)] // Tiếp giáp trước (không trùng)
    [InlineData("2026-11-02T10:00:00Z", "2026-11-02T12:00:00Z", "2026-11-02T08:00:00Z", "2026-11-02T10:00:00Z", false)] // Tiếp giáp sau (không trùng)
    [InlineData("2026-11-03T08:00:00Z", "2026-11-03T10:00:00Z", "2026-11-02T08:00:00Z", "2026-11-02T10:00:00Z", false)] // Khác ngày hoàn toàn
    public void ConflictDetection_Logic_ShouldAccuratelyDetermineOverlap(
        string newStartStr,
        string newEndStr,
        string existingStartStr,
        string existingEndStr,
        bool shouldConflict)
    {
        // Arrange
        var newSessionStart = DateTimeOffset.Parse(newStartStr);
        var newSessionEnd = DateTimeOffset.Parse(newEndStr);
        var existingStart = DateTimeOffset.Parse(existingStartStr);
        var existingEnd = DateTimeOffset.Parse(existingEndStr);

        // Act: Formula: newSession.StartTime < existingSession.EndTime && newSession.EndTime > existingSession.StartTime
        var isConflict = newSessionStart < existingEnd && newSessionEnd > existingStart;

        // Assert
        Assert.Equal(shouldConflict, isConflict);
    }
}
