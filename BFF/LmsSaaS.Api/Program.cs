using LmsSaaS.Api.Middlewares;
using LmsSaaS.Api.OpenApi;
using LmsSaaS.Infrastructure;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký kết nối Supabase (PostgreSQL), JWT Authentication & Services từ tầng Infrastructure
builder.Services.AddInfrastructure(builder.Configuration);

// 2. Cấu hình CORS cho phép Next.js Client (http://localhost:3000)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 3. Đăng ký Controllers và tài liệu OpenAPI kèm Transformers
builder.Services.AddControllers();

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
    options.AddOperationTransformer<TenantHeaderOperationTransformer>();
});

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
    await dbContext.Database.MigrateAsync();
    await DbSeeder.SeedAsync(dbContext);
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowClient");

app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();


