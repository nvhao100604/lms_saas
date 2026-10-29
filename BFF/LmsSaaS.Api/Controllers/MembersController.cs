using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.DTOs.Members;
using LmsSaaS.Core.Entities;
using LmsSaaS.Core.Enums;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/members")]
[Authorize]
public class MembersController : ControllerBase
{
    private readonly AppDbContext dbContext;
    private readonly ICurrentTenantService currentTenantService;

    public MembersController(AppDbContext dbContext, ICurrentTenantService currentTenantService)
    {
        this.dbContext = dbContext;
        this.currentTenantService = currentTenantService;
    }

    public MembersController(AppDbContext dbContext)
        : this(dbContext, new CurrentTenantService())
    {
    }

    private Guid? CurrentUserId
    {
        get
        {
            if (currentTenantService?.UserId.HasValue == true)
                return currentTenantService.UserId.Value;

            var claim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User?.FindFirst("sub")?.Value;

            if (Guid.TryParse(claim, out var parsed))
                return parsed;

            return null;
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetMembers([FromQuery] string? role, [FromQuery] string? search)
    {
        var query = dbContext.TenantMembers
            .AsNoTracking()
            .Include(tm => tm.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<RoleInTenant>(role, true, out var roleEnum))
        {
            query = query.Where(tm => tm.Role == roleEnum);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(tm =>
                tm.User.FullName.ToLower().Contains(searchLower) ||
                tm.User.Email.ToLower().Contains(searchLower)
            );
        }

        var members = await query
            .OrderByDescending(tm => tm.JoinedAt)
            .Select(tm => new TenantMemberResponse(
                tm.Id,
                tm.UserId,
                tm.User.FullName,
                tm.User.Email,
                tm.Role.ToString(),
                tm.IsActive,
                tm.JoinedAt
            ))
            .ToListAsync();

        return Ok(new ApiResponse<IReadOnlyList<TenantMemberResponse>>
        {
            Success = true,
            Message = "Lấy danh sách thành viên thành công.",
            Data = members
        });
    }

    [HttpGet("teachers")]
    public async Task<IActionResult> GetTeachers()
    {
        var teachers = await dbContext.TenantMembers
            .AsNoTracking()
            .Include(tm => tm.User)
            .Where(tm => tm.IsActive && (tm.Role == RoleInTenant.Teacher || tm.Role == RoleInTenant.CenterAdmin))
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
            .Where(tm => tm.IsActive && tm.Role == RoleInTenant.Student)
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

    [HttpPost]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> CreateMember([FromBody] CreateTenantMemberRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse<TenantMemberResponse>
            {
                Success = false,
                Message = "Dữ liệu thành viên không hợp lệ."
            });
        }

        var tenantId = currentTenantService.TenantId ?? dbContext.CurrentTenantId;
        if (!tenantId.HasValue)
        {
            return Unauthorized(new ApiResponse<TenantMemberResponse>
            {
                Success = false,
                Message = "Ngữ cảnh trung tâm không hợp lệ."
            });
        }

        // Quy tắc 1: Kiểm soát hạn ngạch học viên của gói cước
        if (request.Role == RoleInTenant.Student)
        {
            var tenant = await dbContext.Tenants
                .IgnoreQueryFilters()
                .Include(t => t.SubscriptionPlan)
                .FirstOrDefaultAsync(t => t.Id == tenantId.Value);

            if (tenant?.SubscriptionPlan != null && tenant.SubscriptionPlan.MaxStudentsLimit > 0)
            {
                var currentStudentCount = await dbContext.TenantMembers
                    .CountAsync(tm => tm.Role == RoleInTenant.Student);

                if (currentStudentCount >= tenant.SubscriptionPlan.MaxStudentsLimit)
                {
                    return BadRequest(new ApiResponse<TenantMemberResponse>
                    {
                        Success = false,
                        Message = $"Trung tâm đã đạt giới hạn tối đa {tenant.SubscriptionPlan.MaxStudentsLimit} học viên của gói {tenant.SubscriptionPlan.Name}. Vui lòng nâng cấp gói cước."
                    });
                }
            }
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        var isInMemory = dbContext.Database.ProviderName?.Contains("InMemory") == true;
        await using var transaction = isInMemory ? null : await dbContext.Database.BeginTransactionAsync();

        if (user == null)
        {
            var passwordHash = string.IsNullOrWhiteSpace(request.InitialPassword)
                ? "Lms@123456"
                : request.InitialPassword.Trim();

            user = new User
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                FullName = request.FullName.Trim(),
                PasswordHash = passwordHash,
                CreatedAt = DateTimeOffset.UtcNow
            };
            await dbContext.Users.AddAsync(user);
        }
        else
        {
            var alreadyMember = await dbContext.TenantMembers
                .AnyAsync(tm => tm.TenantId == tenantId.Value && tm.UserId == user.Id);

            if (alreadyMember)
            {
                return BadRequest(new ApiResponse<TenantMemberResponse>
                {
                    Success = false,
                    Message = "Thành viên với email này đã tồn tại trong trung tâm."
                });
            }
        }

        var newMember = new TenantMember
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId.Value,
            UserId = user.Id,
            Role = request.Role,
            IsActive = true,
            JoinedAt = DateTimeOffset.UtcNow,
            User = user
        };

        await dbContext.TenantMembers.AddAsync(newMember);
        await dbContext.SaveChangesAsync();

        if (transaction != null)
        {
            await transaction.CommitAsync();
        }

        var responseData = new TenantMemberResponse(
            newMember.Id,
            user.Id,
            user.FullName,
            user.Email,
            newMember.Role.ToString(),
            newMember.IsActive,
            newMember.JoinedAt
        );

        return StatusCode(201, new ApiResponse<TenantMemberResponse>
        {
            Success = true,
            Message = "Thêm thành viên vào trung tâm thành công.",
            Data = responseData
        });
    }

    [HttpPatch("{memberId:guid}")]
    [Authorize(Roles = "CenterAdmin")]
    public async Task<IActionResult> PatchMember(Guid memberId, [FromBody] PatchTenantMemberRequest request)
    {
        var member = await dbContext.TenantMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(tm => tm.Id == memberId);

        if (member == null)
        {
            return NotFound(new ApiResponse<TenantMemberResponse>
            {
                Success = false,
                Message = "Không tìm thấy thông tin thành viên."
            });
        }

        // Quy tắc 2: Self-Lockout Prevention
        var currentUserId = CurrentUserId;
        if (currentUserId.HasValue && member.UserId == currentUserId.Value)
        {
            if ((request.Role.HasValue && request.Role.Value != RoleInTenant.CenterAdmin) ||
                (request.IsActive.HasValue && !request.IsActive.Value))
            {
                return BadRequest(new ApiResponse<TenantMemberResponse>
                {
                    Success = false,
                    Message = "Bạn không thể tự hạ quyền quản trị hoặc tự khóa tài khoản của chính mình."
                });
            }
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            member.User.FullName = request.FullName.Trim();
        }

        if (request.Role.HasValue)
        {
            member.Role = request.Role.Value;
        }

        if (request.IsActive.HasValue)
        {
            member.IsActive = request.IsActive.Value;
        }

        await dbContext.SaveChangesAsync();

        return Ok(new ApiResponse<TenantMemberResponse>
        {
            Success = true,
            Message = "Cập nhật thông tin thành viên thành công.",
            Data = new TenantMemberResponse(
                member.Id,
                member.UserId,
                member.User.FullName,
                member.User.Email,
                member.Role.ToString(),
                member.IsActive,
                member.JoinedAt
            )
        });
    }
}
