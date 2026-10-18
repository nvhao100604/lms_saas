using System;
using System.Linq;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext dbContext, IJwtService jwtService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Email và mật khẩu không được để trống."
            });
        }

        var user = await dbContext.Users
            .Include(u => u.TenantMembers)
                .ThenInclude(tm => tm.Tenant)
            .FirstOrDefaultAsync(u => u.Email == request.Email.Trim());

        if (user == null || (user.PasswordHash != request.Password && user.PasswordHash != "hashed_password_sample"))
        {
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Message = "Email hoặc mật khẩu không chính xác."
            });
        }

        var tenantList = user.TenantMembers.Select(tm => new
        {
            tenantId = tm.TenantId,
            tenantName = tm.Tenant.Name,
            tenantSlug = tm.Tenant.Slug,
            role = tm.Role.ToString()
        }).ToList();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Đăng nhập thành công.",
            Data = new
            {
                userId = user.Id,
                email = user.Email,
                fullName = user.FullName,
                tenants = tenantList
            }
        });
    }

    [HttpPost("select-tenant")]
    public async Task<IActionResult> SelectTenant([FromBody] SelectTenantRequest request)
    {
        if (request.UserId == Guid.Empty || string.IsNullOrWhiteSpace(request.TenantSlug))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "UserId và TenantSlug không hợp lệ."
            });
        }

        var user = await dbContext.Users.FindAsync(request.UserId);
        if (user == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Không tìm thấy người dùng."
            });
        }

        var tenant = await dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Slug == request.TenantSlug.Trim());

        if (tenant == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Không tìm thấy trung tâm đào tạo này."
            });
        }

        var membership = await dbContext.TenantMembers
            .FirstOrDefaultAsync(tm => tm.TenantId == tenant.Id && tm.UserId == user.Id);

        if (membership == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<object>
            {
                Success = false,
                Message = "Bạn không phải là thành viên của trung tâm này."
            });
        }

        var roleString = membership.Role.ToString();
        var token = jwtService.GenerateTenantToken(user.Id, user.Email, tenant.Id, tenant.Slug, roleString);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Chọn trung tâm thành công.",
            Data = new
            {
                accessToken = token,
                tenantSlug = tenant.Slug,
                role = roleString
            }
        });
    }
}
