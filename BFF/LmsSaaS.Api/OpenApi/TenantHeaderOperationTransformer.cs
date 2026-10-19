using System;
using System.Collections.Generic;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using LmsSaaS.Core.Common;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;

namespace LmsSaaS.Api.OpenApi;

public sealed class TenantHeaderOperationTransformer(IOptions<TenantSettings>? tenantSettings = null) : IOpenApiOperationTransformer
{
    private static readonly HashSet<string> IgnoredPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "api/auth/login",
        "api/auth/select-tenant",
        "api/auth/refresh",
        "api/health"
    };

    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var relativePath = context.Description.RelativePath?.TrimStart('/');
        if (string.IsNullOrEmpty(relativePath))
        {
            return Task.CompletedTask;
        }

        foreach (var ignoredPath in IgnoredPaths)
        {
            if (relativePath.StartsWith(ignoredPath, StringComparison.OrdinalIgnoreCase))
            {
                return Task.CompletedTask;
            }
        }

        var defaultSlug = tenantSettings?.Value.DefaultTenantSlug ?? "apex-english";

        operation.Parameters ??= new List<IOpenApiParameter>();
        operation.Parameters.Add(new OpenApiParameter
        {
            Name = "X-Tenant-Slug",
            In = ParameterLocation.Header,
            Required = false,
            Description = $"Workspace slug (Tenant context). Default is {defaultSlug}.",
            Schema = new OpenApiSchema
            {
                Type = JsonSchemaType.String,
                Default = JsonValue.Create(defaultSlug)
            }
        });

        return Task.CompletedTask;
    }
}
