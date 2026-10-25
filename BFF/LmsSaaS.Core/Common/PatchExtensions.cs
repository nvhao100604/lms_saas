using System;
using System.Collections.Generic;
using System.Reflection;

namespace LmsSaaS.Core.Common;

public static class PatchExtensions
{
    public static Dictionary<string, object?> ToPatchDictionary<T>(this T patchRequest) where T : class
    {
        ArgumentNullException.ThrowIfNull(patchRequest);

        var result = new Dictionary<string, object?>(StringComparer.Ordinal);
        var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        foreach (var prop in properties)
        {
            if (!prop.CanRead) continue;
            var value = prop.GetValue(patchRequest);
            if (value is not null)
            {
                result[prop.Name] = value is string str ? str.Trim() : value;
            }
        }

        return result;
    }
}
