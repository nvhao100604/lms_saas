import { WorkspaceShell } from "@/components/layout";

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

  return <WorkspaceShell tenantSlug={tenantSlug}>{children}</WorkspaceShell>;
}
