import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "@/constants/config";
import { bffClient, handleBffError } from "@/lib/bff-client";
import type { AuthApiResponse, RefreshTokenResponse } from "@/types/auth";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    return NextResponse.json<AuthApiResponse>(
      {
        success: false,
        message: "Refresh token not found in active session.",
      },
      { status: 401 }
    );
  }

  try {
    const response = await bffClient.post<AuthApiResponse<RefreshTokenResponse>>(
      "/api/auth/refresh",
      { refreshToken }
    );

    const { data } = response;
    if (!data.success || !data.data?.accessToken) {
      cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
      cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);
      return NextResponse.json(data, { status: 401 });
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      tenantSlug,
      role,
    } = data.data;

    const isProd = process.env.NODE_ENV === "production";

    cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: accessTokenExpiresIn,
    });

    if (newRefreshToken) {
      cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: refreshTokenExpiresIn,
      });
    }

    return NextResponse.json({
      success: true,
      tenantSlug,
      role,
    });
  } catch (error) {
    cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
    cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);
    return handleBffError(error);
  }
}
