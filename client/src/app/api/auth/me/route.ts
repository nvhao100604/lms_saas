import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "@/constants/config";
import { decodeJwtPayload } from "@/proxy";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthenticated" },
      { status: 401 }
    );
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Invalid session token" },
      { status: 401 }
    );
  }

  const role =
    ((payload["role"] ||
      payload[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ]) as string) || "Student";
  const email =
    ((payload["email"] ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ]) as string) || "";
  const userId =
    ((payload["nameid"] ||
      payload["sub"] ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]) as string) || "";
  const tenantSlug =
    ((payload["tenant_slug"] || payload["tenantSlug"]) as string) || "";

  return NextResponse.json({
    success: true,
    data: {
      userId,
      email,
      role,
      tenantSlug,
    },
  });
}
