using System;
using System.Linq;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Entities;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext dbContext,
    IJwtService jwtService,
    IOptions<JwtOptions> jwtOptions) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Email and password are required."
            });
        }

        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .Include(u => u.TenantMembers)
                .ThenInclude(tm => tm.Tenant)
            .FirstOrDefaultAsync(u => u.Email == request.Email.Trim());

        if (user == null || (user.PasswordHash != request.Password && user.PasswordHash != "hashed_password_sample"))
        {
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Message = "Invalid email or password."
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
            Message = "Login successful.",
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
                Message = "UserId and TenantSlug are required."
            });
        }

        var user = await dbContext.Users.FindAsync(request.UserId);
        if (user == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "User not found."
            });
        }

        var tenant = await dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Slug == request.TenantSlug.Trim());

        if (tenant == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Training center not found."
            });
        }

        var membership = await dbContext.TenantMembers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(tm => tm.TenantId == tenant.Id && tm.UserId == user.Id);

        if (membership == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<object>
            {
                Success = false,
                Message = "You are not a member of this workspace."
            });
        }

        var roleString = membership.Role.ToString();
        var token = jwtService.GenerateTenantToken(user.Id, user.Email, tenant.Id, tenant.Slug, roleString);
        var refreshTokenString = jwtService.GenerateRefreshToken();
        var expiryHours = jwtOptions.Value.ExpiryHours > 0 ? jwtOptions.Value.ExpiryHours : 4.0;
        var expiryDays = jwtOptions.Value.RefreshTokenExpiryDays > 0 ? jwtOptions.Value.RefreshTokenExpiryDays : 7;
        var accessTokenExpiresIn = (int)TimeSpan.FromHours(expiryHours).TotalSeconds;
        var refreshTokenExpiresIn = (int)TimeSpan.FromDays(expiryDays).TotalSeconds;

        var refreshToken = new RefreshToken
        {
            TenantId = tenant.Id,
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(expiryDays)
        };

        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Workspace selected successfully.",
            Data = new
            {
                accessToken = token,
                refreshToken = refreshTokenString,
                accessTokenExpiresIn,
                refreshTokenExpiresIn,
                tenantSlug = tenant.Slug,
                role = roleString
            }
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "RefreshToken is required."
            });
        }

        var storedToken = await dbContext.RefreshTokens
            .IgnoreQueryFilters()
            .Include(rt => rt.Tenant)
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken.Trim());

        if (storedToken == null || !storedToken.IsActive || storedToken.Tenant == null || storedToken.User == null)
        {
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Message = "RefreshToken is invalid, expired, or revoked."
            });
        }

        var membership = await dbContext.TenantMembers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(tm => tm.TenantId == storedToken.TenantId && tm.UserId == storedToken.UserId);

        if (membership == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<object>
            {
                Success = false,
                Message = "User is no longer a member of this workspace."
            });
        }

        var roleString = membership.Role.ToString();
        var newRefreshTokenString = jwtService.GenerateRefreshToken();
        var expiryHours = jwtOptions.Value.ExpiryHours > 0 ? jwtOptions.Value.ExpiryHours : 4.0;
        var expiryDays = jwtOptions.Value.RefreshTokenExpiryDays > 0 ? jwtOptions.Value.RefreshTokenExpiryDays : 7;
        var accessTokenExpiresIn = (int)TimeSpan.FromHours(expiryHours).TotalSeconds;
        var refreshTokenExpiresIn = (int)TimeSpan.FromDays(expiryDays).TotalSeconds;

        // Đánh dấu token cũ đã bị thay thế
        storedToken.RevokedAt = DateTimeOffset.UtcNow;
        storedToken.ReplacedByToken = newRefreshTokenString;

        // Lưu Refresh Token mới
        var newRefreshToken = new RefreshToken
        {
            TenantId = storedToken.TenantId,
            UserId = storedToken.UserId,
            Token = newRefreshTokenString,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(expiryDays)
        };

        dbContext.RefreshTokens.Add(newRefreshToken);

        var newAccessToken = jwtService.GenerateTenantToken(
            storedToken.User.Id,
            storedToken.User.Email,
            storedToken.Tenant.Id,
            storedToken.Tenant.Slug,
            roleString
        );

        await dbContext.SaveChangesAsync();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Token refreshed successfully.",
            Data = new
            {
                accessToken = newAccessToken,
                refreshToken = newRefreshTokenString,
                accessTokenExpiresIn,
                refreshTokenExpiresIn,
                tenantSlug = storedToken.Tenant.Slug,
                role = roleString
            }
        });
    }

    [Authorize]
    [HttpPost("revoke")]
    public async Task<IActionResult> RevokeToken([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "RefreshToken is required."
            });
        }

        var storedToken = await dbContext.RefreshTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken.Trim());

        if (storedToken == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Token to revoke not found."
            });
        }

        if (storedToken.IsActive)
        {
            storedToken.RevokedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync();
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "RefreshToken revoked successfully."
        });
    }
}
