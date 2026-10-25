import { NextRequest, NextResponse } from "next/server";
import { ROUTES } from "@/constants/routes";
import { COOKIE_NAMES, ENV_CONFIG } from "@/constants/config";
import type { AuthApiResponse, RefreshTokenResponse } from "@/types/auth";

/**
 * Decode JWT base64url payload without external libraries.
 * Edge-compatible and highly performant.
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
 * Redirect user to login page and clean up authentication cookies.
 */
function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL(ROUTES.AUTH.LOGIN, request.url);
  loginUrl.searchParams.set("redirect", pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
  response.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
  return response;
}

/**
 * Next.js 16 Proxy Convention (replaces deprecated middleware convention).
 * Protects tenant routes, validates tokens, and performs silent refresh token rotation.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Extract tenant slug from URL (e.g. /apex-english/dashboard -> apex-english)
  const segments = pathname.split("/").filter(Boolean);
  const requestedTenantSlug = segments[0];

  // Allow home page or requests without tenant slug to proceed
  if (!requestedTenantSlug) {
    return NextResponse.next();
  }

  // 1. Read cookies from request
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  // 2. Validate access_token expiration
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  const exp = typeof payload?.exp === "number" ? payload.exp : 0;
  const isAccessTokenValid = Boolean(payload && exp > currentTimeInSeconds);

  // 3. When access_token is missing or expired: Perform Silent Refresh Token Rotation
  if (!isAccessTokenValid) {
    // If no refresh token exists, redirect to login
    if (!refreshToken) {
      return redirectToLogin(request, pathname);
    }

    // Attempt silent refresh via .NET BFF
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

          // Context Mismatch check: Ensure token matches requested tenant
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
            // Forward refreshed cookies to downstream Server Components
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

          // Attach fresh tokens to response Set-Cookie headers
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
      // If BFF communication fails, redirect to login safely
    }

    return redirectToLogin(request, pathname);
  }

  // 4. Token is valid: check tenant context mismatch
  const tokenTenantSlug = (payload?.tenant_slug || payload?.tenantSlug) as string | undefined;

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

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login).*)",
  ],
};
