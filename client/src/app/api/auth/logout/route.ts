import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "@/constants/config";
import { bffClient } from "@/lib/bff-client";
import type { AuthApiResponse } from "@/types/auth";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  // Nếu có refresh token, gọi sang .NET BFF để thu hồi token trong DB
  if (refreshToken) {
    try {
      await bffClient.post(
        "/api/auth/revoke",
        { refreshToken },
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        }
      );
    } catch {
      // Downstream failure to revoke does not prevent local cookie eviction
    }
  }

  // Xóa sạch cả 2 cookies trên trình duyệt
  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);

  return NextResponse.json<AuthApiResponse<{ success: boolean }>>({
    success: true,
    message: "Logged out successfully.",
    data: { success: true },
  });
}
