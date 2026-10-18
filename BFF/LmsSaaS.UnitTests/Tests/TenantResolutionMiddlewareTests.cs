using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using LmsSaaS.Api.Middlewares;
using LmsSaaS.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class TenantResolutionMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenUnauthenticated_ShouldCallNextWithoutSettingTenantContext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var currentTenantService = new CurrentTenantService();
        var nextCalled = false;

        var middleware = new TenantResolutionMiddleware((innerContext) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context, currentTenantService);

        // Assert
        Assert.True(nextCalled);
        Assert.Null(currentTenantService.TenantId);
        Assert.Null(currentTenantService.TenantSlug);
    }

    [Fact]
    public async Task InvokeAsync_WhenAuthenticatedWithMatchingSlug_ShouldSetTenantContextAndCallNext()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var slug = "apex-english";
        var role = "Teacher";

        var context = new DefaultHttpContext();
        context.Request.Headers["X-Tenant-Slug"] = slug;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim("tenant_id", tenantId.ToString()),
            new Claim("tenant_slug", slug)
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var currentTenantService = new CurrentTenantService();
        var nextCalled = false;

        var middleware = new TenantResolutionMiddleware((innerContext) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context, currentTenantService);

        // Assert
        Assert.True(nextCalled);
        Assert.Equal(tenantId, currentTenantService.TenantId);
        Assert.Equal(slug, currentTenantService.TenantSlug);
        Assert.Equal(userId, currentTenantService.UserId);
        Assert.Equal(role, currentTenantService.Role);
    }

    [Fact]
    public async Task InvokeAsync_WhenAuthenticatedWithMismatchedSlug_ShouldReturn403ForbiddenAndNotCallNext()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var tokenSlug = "apex-english";
        var headerSlug = "codepro-academy";

        var context = new DefaultHttpContext();
        context.Request.Headers["X-Tenant-Slug"] = headerSlug;
        context.Response.Body = new MemoryStream();

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("tenant_id", tenantId.ToString()),
            new Claim("tenant_slug", tokenSlug)
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var currentTenantService = new CurrentTenantService();
        var nextCalled = false;

        var middleware = new TenantResolutionMiddleware((innerContext) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context, currentTenantService);

        // Assert
        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
        Assert.Null(currentTenantService.TenantId);
    }
}
