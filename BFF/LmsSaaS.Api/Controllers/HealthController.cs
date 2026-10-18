using System;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using LmsSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace LmsSaaS.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("supabase")]
    public async Task<IActionResult> CheckSupabaseConnection()
    {
        try
        {
            var canConnect = await dbContext.Database.CanConnectAsync();
            if (canConnect)
            {
                return Ok(new ApiResponse<string>
                {
                    Success = true,
                    Message = "Connection from .NET BFF to Supabase PostgreSQL successful!"
                });
            }

            return StatusCode(503, new ApiResponse<string> { Success = false, Message = "Unable to connect to Supabase." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<string> { Success = false, Error = ex.Message });
        }
    }
}
