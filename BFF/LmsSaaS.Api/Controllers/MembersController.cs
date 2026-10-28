using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Members;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/members")]
[Authorize]
public class MembersController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("teachers")]
    public async Task<IActionResult> GetTeachers()
    {
        var teachers = await dbContext.TenantMembers
            .AsNoTracking()
            .Include(tm => tm.User)
            .Where(tm => tm.Role == RoleInTenant.Teacher || tm.Role == RoleInTenant.CenterAdmin)
            .Select(tm => new TenantTeacherResponse(
                tm.UserId,
                tm.User.FullName,
                tm.User.Email,
                tm.Role.ToString()
            ))
            .ToListAsync();

        return Ok(new ApiResponse<IReadOnlyList<TenantTeacherResponse>>
        {
            Success = true,
            Message = "Lấy danh sách giảng viên thành công.",
            Data = teachers
        });
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetStudents()
    {
        var students = await dbContext.TenantMembers
            .AsNoTracking()
            .Include(tm => tm.User)
            .Where(tm => tm.Role == RoleInTenant.Student)
            .OrderBy(tm => tm.User.FullName)
            .Select(tm => new TenantStudentResponse(
                tm.UserId,
                tm.User.FullName,
                tm.User.Email
            ))
            .ToListAsync();

        return Ok(new ApiResponse<IReadOnlyList<TenantStudentResponse>>
        {
            Success = true,
            Message = "Lấy danh sách học viên thành công.",
            Data = students
        });
    }
}

