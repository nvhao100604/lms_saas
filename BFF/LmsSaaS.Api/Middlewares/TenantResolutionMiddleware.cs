using System;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using Microsoft.AspNetCore.Http;

namespace LmsSaaS.Api.Middlewares;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ICurrentTenantService currentTenantService)
    {
        var headerSlug = context.Request.Headers["X-Tenant-Slug"].ToString()?.Trim();

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tokenSlug = context.User.FindFirst("tenant_slug")?.Value;

            // Nếu có header X-Tenant-Slug và không khớp với tenant_slug trong token -> Trả về 403 Forbidden
            if (!string.IsNullOrWhiteSpace(headerSlug) &&
                !string.Equals(headerSlug, tokenSlug, StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json; charset=utf-8";

                var jsonResponse = JsonSerializer.Serialize(new
                {
                    success = false,
                    message = "Access denied: Your token does not belong to this workspace."
                });

                await context.Response.WriteAsync(jsonResponse);
                return;
            }

            var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value;

            if (Guid.TryParse(tenantIdClaim, out var tenantId))
            {
                Guid? userId = Guid.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : null;
                var effectiveSlug = !string.IsNullOrEmpty(tokenSlug) ? tokenSlug : headerSlug ?? string.Empty;

                currentTenantService.SetTenantContext(tenantId, effectiveSlug, userId, roleClaim);
            }
        }

        await _next(context);
    }
}
