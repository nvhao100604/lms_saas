using System;
using LmsSaaS.Core.Common;
using LmsSaaS.Core.Entities;
using Microsoft.Extensions.Options;
using Xunit;

namespace LmsSaaS.UnitTests.Tests;

public class RefreshTokenRotationTests
{
    [Fact]
    public void RefreshToken_WhenCreatedWithFutureExpiry_ShouldBeActive()
    {
        // Arrange
        var token = new RefreshToken
        {
            TenantId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Token = "secure_random_token_123",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        };

        // Assert
        Assert.True(token.IsActive);
        Assert.False(token.IsExpired);
        Assert.False(token.IsRevoked);
        Assert.Null(token.RevokedAt);
        Assert.Null(token.ReplacedByToken);
    }

    [Fact]
    public void RefreshToken_WhenPastExpiryDate_ShouldBeExpiredAndInactive()
    {
        // Arrange
        var token = new RefreshToken
        {
            TenantId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Token = "expired_token_123",
            ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(-10),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-7)
        };

        // Assert
        Assert.False(token.IsActive);
        Assert.True(token.IsExpired);
        Assert.False(token.IsRevoked);
    }

    [Fact]
    public void RefreshToken_WhenRevoked_ShouldBeRevokedAndInactive()
    {
        // Arrange
        var token = new RefreshToken
        {
            TenantId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Token = "revoked_token_123",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow,
            RevokedAt = DateTimeOffset.UtcNow
        };

        // Assert
        Assert.False(token.IsActive);
        Assert.False(token.IsExpired);
        Assert.True(token.IsRevoked);
        Assert.NotNull(token.RevokedAt);
    }

    [Fact]
    public void RefreshToken_RotationFlow_ShouldRevokeOldTokenAndReplaceWithNewToken()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var oldToken = new RefreshToken
        {
            TenantId = tenantId,
            UserId = userId,
            Token = "old_refresh_token_string",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        };

        Assert.True(oldToken.IsActive);

        // Act - Simulate Refresh Token Rotation
        var newRefreshTokenString = "new_rotated_refresh_token_string";
        var rotatedAt = DateTimeOffset.UtcNow;

        oldToken.RevokedAt = rotatedAt;
        oldToken.ReplacedByToken = newRefreshTokenString;

        var newToken = new RefreshToken
        {
            TenantId = tenantId,
            UserId = userId,
            Token = newRefreshTokenString,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = rotatedAt
        };

        // Assert
        Assert.False(oldToken.IsActive);
        Assert.True(oldToken.IsRevoked);
        Assert.Equal(newRefreshTokenString, oldToken.ReplacedByToken);
        Assert.Equal(rotatedAt, oldToken.RevokedAt);

        Assert.True(newToken.IsActive);
        Assert.False(newToken.IsRevoked);
        Assert.False(newToken.IsExpired);
        Assert.Equal(tenantId, newToken.TenantId);
        Assert.Equal(userId, newToken.UserId);
        Assert.Equal(newRefreshTokenString, newToken.Token);
    }

    [Fact]
    public void RefreshToken_ShouldImplementITenantEntity()
    {
        // Arrange & Act
        var implementsITenant = typeof(ITenantEntity).IsAssignableFrom(typeof(RefreshToken));

        // Assert
        Assert.True(implementsITenant);
    }

    [Fact]
    public void JwtOptions_ShouldConfigureRefreshTokenExpiryDaysViaOptionsPattern()
    {
        // Arrange
        var optionsValue = new JwtOptions
        {
            RefreshTokenExpiryDays = 14
        };
        var options = Options.Create(optionsValue);

        // Assert
        Assert.Equal(14, options.Value.RefreshTokenExpiryDays);
    }
}
