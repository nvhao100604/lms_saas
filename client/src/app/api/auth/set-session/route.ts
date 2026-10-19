import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "@/constants/config";
import { bffClient, handleBffError } from "@/lib/bff-client";
import type {
  SetSessionRequest,
  SelectTenantResponse,
  AuthApiResponse,
  SetSessionResponse,
} from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: SetSessionRequest = await request.json();
    const response = await bffClient.post<AuthApiResponse<SelectTenantResponse>>(
      "/api/auth/select-tenant",
      body
    );

    const { data } = response;
    if (!data.success || !data.data?.accessToken) {
      return NextResponse.json(data, { status: response.status || 400 });
    }

    const {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      tenantSlug: targetSlug,
      role,
    } = data.data;

    // Lưu Access Token và Refresh Token an toàn vào HttpOnly Cookie phía Server (BFF Pattern)
    // Thời hạn maxAge được đồng bộ động từ Backend .NET (Single Source of Truth)
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: accessTokenExpiresIn,
    });

    if (refreshToken) {
      cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: refreshTokenExpiresIn,
      });
    }

    return NextResponse.json<SetSessionResponse>({
      success: true,
      tenantSlug: targetSlug,
      role: role,
    });
  } catch (error) {
    return handleBffError(error);
  }
}
