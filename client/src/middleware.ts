import { NextRequest, NextResponse } from "next/server";
import { ROUTES } from "@/constants/routes";
import { COOKIE_NAMES, ENV_CONFIG } from "@/constants/config";
import type { AuthApiResponse, RefreshTokenResponse } from "@/types/auth";

/**
 * Giải mã phần Base64URL Payload của JWT token mà không dùng thư viện ngoài
 * Đảm bảo tương thích hoàn hảo và tối ưu hiệu năng trên Edge/Node Runtime
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Điều hướng về trang đăng nhập và dọn dẹp toàn bộ cookies xác thực
 */
function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL(ROUTES.AUTH.LOGIN, request.url);
  loginUrl.searchParams.set("redirect", pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
  response.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Bóc tách slug của trung tâm từ URL (ví dụ: /apex-english/dashboard -> apex-english)
  const segments = pathname.split("/").filter(Boolean);
  const requestedTenantSlug = segments[0];

  // Nếu là trang chủ hoặc không có requestedTenantSlug, cho phép tiếp tục
  if (!requestedTenantSlug) {
    return NextResponse.next();
  }

  // 1. Đọc cookies từ request
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  // 2. Kiểm tra tính hợp lệ và thời hạn của access_token
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  const exp = typeof payload?.exp === "number" ? payload.exp : 0;
  const isAccessTokenValid = Boolean(payload && exp > currentTimeInSeconds);

  // 3. Trường hợp access_token không có hoặc đã hết hạn -> Silent Refresh Token Rotation
  if (!isAccessTokenValid) {
    // Nếu KHÔNG có refresh_token -> chuyển hướng về Login
    if (!refreshToken) {
      return redirectToLogin(request, pathname);
    }

    // Nếu CÓ refresh_token -> Tự động gọi sang .NET BFF để xoay vòng token (Silent Refresh)
    try {
      const refreshResponse = await fetch(`${ENV_CONFIG.DOTNET_API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (refreshResponse.ok) {
        const result: AuthApiResponse<RefreshTokenResponse> = await refreshResponse.json();

        if (result.success && result.data?.accessToken) {
          const {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            accessTokenExpiresIn,
            refreshTokenExpiresIn,
            tenantSlug,
          } = result.data;

          const isProd = process.env.NODE_ENV === "production";
          let response: NextResponse;

          // Kiểm tra Context Mismatch: Nếu slug yêu cầu khác với slug của token vừa refresh
          if (
            tenantSlug &&
            requestedTenantSlug.toLowerCase() !== tenantSlug.toLowerCase()
          ) {
            const correctDashboardUrl = new URL(
              ROUTES.TENANT.DASHBOARD(tenantSlug),
              request.url
            );
            response = NextResponse.redirect(correctDashboardUrl);
          } else {
            // Cập nhật cookie header cho downstream request của Server Components
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set(
              "cookie",
              `${COOKIE_NAMES.ACCESS_TOKEN}=${newAccessToken}; ${COOKIE_NAMES.REFRESH_TOKEN}=${newRefreshToken}`
            );
            response = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
          }

          // Đính kèm cặp token mới vào Set-Cookie của response gửi về trình duyệt
          // Thời hạn maxAge đồng bộ trực tiếp từ Backend .NET (Single Source of Truth)
          response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, newAccessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            path: "/",
            maxAge: accessTokenExpiresIn,
          });

          if (newRefreshToken) {
            response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, {
              httpOnly: true,
              secure: isProd,
              sameSite: "lax",
              path: "/",
              maxAge: refreshTokenExpiresIn,
            });
          }

          return response;
        }
      }
    } catch {
      // Khi gặp lỗi kết nối tới .NET BFF, chuyển tiếp về trang Login an toàn
    }

    // Nếu gọi refresh thất bại hoặc phản hồi không hợp lệ -> xóa sạch cookies và chuyển hướng về Login
    return redirectToLogin(request, pathname);
  }

  // 4. Trường hợp access_token vẫn còn hạn:
  // Lấy tenant_slug từ token claim (hỗ trợ cả tenant_slug lẫn tenantSlug)
  const tokenTenantSlug = (payload?.tenant_slug || payload?.tenantSlug) as string | undefined;

  // Context Mismatch Check: Chống truy cập chéo giữa các trung tâm
  if (
    tokenTenantSlug &&
    requestedTenantSlug.toLowerCase() !== tokenTenantSlug.toLowerCase()
  ) {
    const correctDashboardUrl = new URL(
      ROUTES.TENANT.DASHBOARD(tokenTenantSlug),
      request.url
    );
    return NextResponse.redirect(correctDashboardUrl);
  }

  // Token hoàn toàn hợp lệ và đúng ngữ cảnh trung tâm
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login).*)",
  ],
};
