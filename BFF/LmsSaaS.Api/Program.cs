using LmsSaaS.Api.Middlewares;
using LmsSaaS.Infrastructure;
using LmsSaaS.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký kết nối Supabase (PostgreSQL), JWT Authentication & Services từ tầng Infrastructure
builder.Services.AddInfrastructure(builder.Configuration);

// 2. Đăng ký Controllers và tài liệu OpenAPI
builder.Services.AddControllers();

builder.Services.AddOpenApi();

var app = builder.Build();

// 3. Cấu hình HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "LMS SaaS API v1");
        options.RoutePrefix = string.Empty;
    });
}

// 4. Chạy tự động Seed Data nếu Database chưa có dữ liệu
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(dbContext);
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();
