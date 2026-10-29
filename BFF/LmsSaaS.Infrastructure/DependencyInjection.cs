using System;
using System.Text;
using LmsSaaS.Core.Common;
using LmsSaaS.Infrastructure.Messaging.Consumers;
using LmsSaaS.Infrastructure.Persistence;
using LmsSaaS.Infrastructure.Services;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace LmsSaaS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("The 'DefaultConnection' connection string for Supabase has not been configured.");
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<ICurrentTenantService, CurrentTenantService>();
        services.AddScoped<IScheduleGeneratorService, ScheduleGeneratorService>();

        // 1. Đăng ký Options Pattern và Service cho Jwt & Tenant
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<TenantSettings>(configuration.GetSection(TenantSettings.SectionName));
        services.AddScoped<IJwtService, JwtService>();

        // 2. Cấu hình Authentication với AddJwtBearer
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var key = Encoding.UTF8.GetBytes(jwtOptions.SecretKey);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,
                ClockSkew = TimeSpan.Zero
            };
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (string.IsNullOrEmpty(context.Token) &&
                        context.Request.Cookies.TryGetValue("access_token", out var token))
                    {
                        context.Token = token;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();

        // 3. Cấu hình MassTransit với cơ chế Hybrid Transport (RabbitMQ vs. InMemory)
        var useRabbitMq = configuration.GetValue<bool>("Messaging:UseRabbitMq");

        services.AddMassTransit(x =>
        {
            x.AddConsumer<ClassCreatedNotificationConsumer>();
            x.AddConsumer<StudentAbsentNotificationConsumer>();

            if (useRabbitMq)
            {
                var rabbitHost = configuration["Messaging:RabbitMqHost"] ?? "localhost";
                var rabbitUser = configuration["Messaging:RabbitMqUser"] ?? "guest";
                var rabbitPass = configuration["Messaging:RabbitMqPassword"] ?? "guest";

                x.UsingRabbitMq((context, cfg) =>
                {
                    cfg.Host(rabbitHost, "/", h =>
                    {
                        h.Username(rabbitUser);
                        h.Password(rabbitPass);
                    });

                    cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
                    cfg.ConfigureEndpoints(context);
                });
            }
            else
            {
                x.UsingInMemory((context, cfg) =>
                {
                    cfg.ConfigureEndpoints(context);
                });
            }
        });

        return services;
    }
}
