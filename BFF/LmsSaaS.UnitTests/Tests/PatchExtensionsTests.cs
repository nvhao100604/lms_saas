using System;
using System.Collections.Generic;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Classes;
using LmsSaaS.Core.DTOs.Courses;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class PatchExtensionsTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=testdb;Username=postgres;Password=postgres")
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public void ToPatchDictionary_WhenNullRequest_ShouldThrowArgumentNullException()
    {
        PatchCourseRequest? request = null;

        Assert.Throws<ArgumentNullException>(() => request!.ToPatchDictionary());
    }

    [Fact]
    public void ToPatchDictionary_WhenAllPropertiesAreNull_ShouldReturnEmptyDictionary()
    {
        var request = new PatchCourseRequest
        {
            Title = null,
            Description = null,
            TuitionFee = null,
            IsActive = null
        };

        var result = request.ToPatchDictionary();

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public void ToPatchDictionary_WhenSomePropertiesProvided_ShouldExtractOnlyNonNullProperties()
    {
        var request = new PatchCourseRequest
        {
            Title = "IELTS Preparation",
            TuitionFee = 5000000m,
            Description = null,
            IsActive = null
        };

        var result = request.ToPatchDictionary();

        Assert.Equal(2, result.Count);
        Assert.True(result.ContainsKey(nameof(PatchCourseRequest.Title)));
        Assert.True(result.ContainsKey(nameof(PatchCourseRequest.TuitionFee)));
        Assert.False(result.ContainsKey(nameof(PatchCourseRequest.Description)));
        Assert.False(result.ContainsKey(nameof(PatchCourseRequest.IsActive)));
        Assert.Equal("IELTS Preparation", result[nameof(PatchCourseRequest.Title)]);
        Assert.Equal(5000000m, result[nameof(PatchCourseRequest.TuitionFee)]);
    }

    [Fact]
    public void ToPatchDictionary_WhenStringHasLeadingOrTrailingWhitespace_ShouldTrimAutomatically()
    {
        var request = new PatchClassRequest
        {
            Name = "   Toeic Master 750+   ",
            RoomName = "   Lab 201   "
        };

        var result = request.ToPatchDictionary();

        Assert.Equal("Toeic Master 750+", result[nameof(PatchClassRequest.Name)]);
        Assert.Equal("Lab 201", result[nameof(PatchClassRequest.RoomName)]);
    }

    [Fact]
    public void ToPatchDictionary_WithEFCoreSetValues_ShouldUpdateOnlyPatchedPropertiesOnEntity()
    {
        using var context = CreateContext();

        var course = new Course
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Title = "Original Course Title",
            Description = "Original Description",
            TuitionFee = 1000000m,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        context.Attach(course);

        var patchRequest = new PatchCourseRequest
        {
            Title = "   Patched Course Title   ",
            TuitionFee = 2500000m
        };

        var patchDict = patchRequest.ToPatchDictionary();
        context.Entry(course).CurrentValues.SetValues(patchDict);

        Assert.Equal("Patched Course Title", course.Title);
        Assert.Equal(2500000m, course.TuitionFee);
        Assert.Equal("Original Description", course.Description);
        Assert.True(course.IsActive);
    }

    [Fact]
    public void ToPatchDictionary_WithEFCoreClassEntity_ShouldUpdateEnumAndNullableFieldsCorrectly()
    {
        using var context = CreateContext();

        var @class = new Class
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            CourseId = Guid.NewGuid(),
            TeacherId = Guid.NewGuid(),
            Name = "Old Class Name",
            RoomName = "Room A",
            StartDate = new DateOnly(2026, 11, 1),
            EndDate = new DateOnly(2026, 12, 1),
            MaxCapacity = 20,
            Status = ClassStatus.Upcoming,
            CreatedAt = DateTimeOffset.UtcNow
        };

        context.Attach(@class);

        var patchRequest = new PatchClassRequest
        {
            Name = "   New Advanced Class   ",
            MaxCapacity = 35,
            Status = ClassStatus.Ongoing
        };

        var patchDict = patchRequest.ToPatchDictionary();
        context.Entry(@class).CurrentValues.SetValues(patchDict);

        Assert.Equal("New Advanced Class", @class.Name);
        Assert.Equal(35, @class.MaxCapacity);
        Assert.Equal(ClassStatus.Ongoing, @class.Status);
        Assert.Equal("Room A", @class.RoomName);
    }
}
