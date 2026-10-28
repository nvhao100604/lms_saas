import { cookies } from "next/headers";
import { WorkspaceShell } from "@/components/layout";
import { COOKIE_NAMES } from "@/constants/config";
import { decodeJwtPayload } from "@/proxy";
import type { CurrentUser } from "@/contexts/AuthContext";

export const instant = false;

export interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    tenantSlug: string;
  }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenantSlug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const payload = token ? decodeJwtPayload(token) : null;

  const role =
    ((payload?.["role"] ||
      payload?.[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ]) as string) || "Student";
  const email =
    ((payload?.["email"] ||
      payload?.[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ]) as string) || "";
  const userId =
    ((payload?.["nameid"] ||
      payload?.["sub"] ||
      payload?.[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]) as string) || "";

  const currentUser: CurrentUser = {
    userId,
    email,
    role,
    tenantSlug,
  };

  return (
    <WorkspaceShell tenantSlug={tenantSlug} currentUser={currentUser}>
      {children}
    </WorkspaceShell>
  );
}

