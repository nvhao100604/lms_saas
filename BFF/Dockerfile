# ===================================================
# Stage 1: Build & Publish (.NET 10 SDK)
# ===================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Tối ưu Docker Layer Caching: Copy các file project để restore dependencies trước
COPY ["LmsSaaS.Core/LmsSaaS.Core.csproj", "LmsSaaS.Core/"]
COPY ["LmsSaaS.Infrastructure/LmsSaaS.Infrastructure.csproj", "LmsSaaS.Infrastructure/"]
COPY ["LmsSaaS.Api/LmsSaaS.Api.csproj", "LmsSaaS.Api/"]

RUN dotnet restore "LmsSaaS.Api/LmsSaaS.Api.csproj"

# Copy toàn bộ mã nguồn còn lại
COPY . .

WORKDIR "/src/LmsSaaS.Api"
RUN dotnet publish "LmsSaaS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ===================================================
# Stage 2: Final Runtime (.NET 10 ASP.NET Core)
# ===================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

EXPOSE 8080

COPY --from=build /app/publish .

# Chạy với user non-root mặc định của .NET (app - UID 1654) để tăng tính bảo mật
USER $APP_UID

ENTRYPOINT ["dotnet", "LmsSaaS.Api.dll"]
