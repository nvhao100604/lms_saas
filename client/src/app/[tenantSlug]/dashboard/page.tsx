import { Suspense } from "react";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "@/constants/config";
import { DashboardView } from "@/components/dashboard/DashboardView";

interface DashboardPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function DashboardContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await paramsPromise;
  const cookieStore = await cookies();
  const hasToken = cookieStore.has(COOKIE_NAMES.ACCESS_TOKEN);

  return <DashboardView tenantSlug={tenantSlug} hasToken={hasToken} />;
}

// Skeleton loading trong khi stream dữ liệu
function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
      <div className="h-16 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

// Server Component chính
export default function DashboardPage({ params }: DashboardPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent paramsPromise={params} />
    </Suspense>
  );
}
