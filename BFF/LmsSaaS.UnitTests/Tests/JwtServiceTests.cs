using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using LmsSaaS.Core.Common;
using LmsSaaS.Infrastructure.Services;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class JwtServiceTests
{
    private readonly JwtOptions _jwtOptions = new()
    {
        SecretKey = "TestSecretKeyForUnitTestingLmsSaaS2026!#@$SuperSecretKey",
        Issuer = "TestIssuer",
        Audience = "TestAudience",
        ExpiryHours = 2.0
    };

    [Fact]
    public void GenerateTenantToken_ShouldReturnValidToken_WithRequiredClaims()
    {
        // Arrange: Dùng Options.Create để inject IOptions<JwtOptions> mà không cần mock IConfiguration
        var options = Options.Create(_jwtOptions);
        var jwtService = new JwtService(options);

        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var email = "john.teacher@apex.edu.vn";
        var tenantSlug = "apex-english";
        var role = "Teacher";

        // Act
        var token = jwtService.GenerateTenantToken(userId, email, tenantId, tenantSlug, role);

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(token));

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadJwtToken(token);

        Assert.Equal(_jwtOptions.Issuer, jwtToken.Issuer);
        Assert.Contains(_jwtOptions.Audience, jwtToken.Audiences);

        var nameIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid");
        Assert.NotNull(nameIdClaim);
        Assert.Equal(userId.ToString(), nameIdClaim.Value);

        var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email");
        Assert.NotNull(emailClaim);
        Assert.Equal(email, emailClaim.Value);

        var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role");
        Assert.NotNull(roleClaim);
        Assert.Equal(role, roleClaim.Value);

        var tenantIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "tenant_id");
        Assert.NotNull(tenantIdClaim);
        Assert.Equal(tenantId.ToString(), tenantIdClaim.Value);

        var tenantSlugClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "tenant_slug");
        Assert.NotNull(tenantSlugClaim);
        Assert.Equal(tenantSlug, tenantSlugClaim.Value);

        Assert.True(jwtToken.ValidTo > DateTime.UtcNow);
    }

    [Fact]
    public void GenerateTenantToken_ShouldValidateSuccessfully_WithValidationParameters()
    {
        // Arrange
        var options = Options.Create(_jwtOptions);
        var jwtService = new JwtService(options);

        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var email = "admin@codepro.vn";
        var tenantSlug = "codepro-academy";
        var role = "CenterAdmin";

        var token = jwtService.GenerateTenantToken(userId, email, tenantId, tenantSlug, role);

        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey)),
            ValidateIssuer = true,
            ValidIssuer = _jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = _jwtOptions.Audience,
            ClockSkew = TimeSpan.Zero
        };

        // Act
        var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

        // Assert
        Assert.NotNull(principal);
        Assert.NotNull(validatedToken);
        Assert.True(principal.Identity?.IsAuthenticated);
        Assert.Equal(email, principal.FindFirst(ClaimTypes.Email)?.Value);
        Assert.Equal(tenantSlug, principal.FindFirst("tenant_slug")?.Value);
    }
}
