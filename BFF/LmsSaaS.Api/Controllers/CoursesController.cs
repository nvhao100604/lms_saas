using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Courses;
using LmsSaaS.Core.Entities;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/courses")]
[Authorize]
public class CoursesController(
    AppDbContext dbContext,
    ICurrentTenantService currentTenantService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var courses = await dbContext.Courses
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CourseResponse(
                c.Id,
                c.Title,
                c.Description,
                c.TuitionFee,
                c.IsActive,
                c.CreatedAt
            ))
            .ToListAsync();

        return Ok(new ApiResponse<IReadOnlyList<CourseResponse>>
        {
            Success = true,
            Message = "Lấy danh sách khóa học thành công.",
            Data = courses
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var course = await dbContext.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (course == null)
        {
            return NotFound(new ApiResponse<CourseResponse>
            {
                Success = false,
                Message = "Không tìm thấy khóa học."
            });
        }

        var response = new CourseResponse(
            course.Id,
            course.Title,
            course.Description,
            course.TuitionFee,
            course.IsActive,
            course.CreatedAt
        );

        return Ok(new ApiResponse<CourseResponse>
        {
            Success = true,
            Data = response
        });
    }

    [HttpPost]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateCourseRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse<CourseResponse>
            {
                Success = false,
                Message = "Dữ liệu yêu cầu không hợp lệ."
            });
        }

        var tenantId = currentTenantService.TenantId;
        if (!tenantId.HasValue)
        {
            return Unauthorized(new ApiResponse<CourseResponse>
            {
                Success = false,
                Message = "Ngữ cảnh trung tâm không hợp lệ."
            });
        }

        var course = new Course
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId.Value,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            TuitionFee = request.TuitionFee,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Courses.Add(course);
        await dbContext.SaveChangesAsync();

        var response = new CourseResponse(
            course.Id,
            course.Title,
            course.Description,
            course.TuitionFee,
            course.IsActive,
            course.CreatedAt
        );

        return CreatedAtAction(nameof(GetById), new { id = course.Id }, new ApiResponse<CourseResponse>
        {
            Success = true,
            Message = "Tạo khóa học thành công.",
            Data = response
        });
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> Patch(Guid id, [FromBody] PatchCourseRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse<CourseResponse>
            {
                Success = false,
                Message = "Dữ liệu yêu cầu không hợp lệ."
            });
        }

        var course = await dbContext.Courses.FirstOrDefaultAsync(c => c.Id == id);
        if (course == null)
        {
            return NotFound(new ApiResponse<CourseResponse>
            {
                Success = false,
                Message = "Không tìm thấy khóa học để cập nhật."
            });
        }

        var patchValues = request.ToPatchDictionary();
        if (patchValues.Count > 0)
        {
            dbContext.Entry(course).CurrentValues.SetValues(patchValues);
            await dbContext.SaveChangesAsync();
        }

        var response = new CourseResponse(
            course.Id,
            course.Title,
            course.Description,
            course.TuitionFee,
            course.IsActive,
            course.CreatedAt
        );

        return Ok(new ApiResponse<CourseResponse>
        {
            Success = true,
            Message = "Cập nhật khóa học thành công.",
            Data = response
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var course = await dbContext.Courses.FirstOrDefaultAsync(c => c.Id == id);
        if (course == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Không tìm thấy khóa học để xóa."
            });
        }

        var hasClasses = await dbContext.Classes.AnyAsync(c => c.CourseId == id);
        if (hasClasses)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Không thể xóa khóa học đã có lớp học trực thuộc. Vui lòng chuyển hoặc xóa các lớp học trước."
            });
        }

        dbContext.Courses.Remove(course);
        await dbContext.SaveChangesAsync();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Xóa khóa học thành công."
        });
    }
}
