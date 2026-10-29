import { Suspense } from "react";
import { MembersView } from "@/components/members";
import { SectionLoadingFallback } from "@/components/layout";

export interface MembersPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function MembersContent({ params }: MembersPageProps) {
  const { tenantSlug } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Quản lý Nhân sự & Học viên Trung tâm
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Quản lý danh sách giảng viên, quản trị viên và học viên thuộc không gian đào tạo của trung tâm.
        </p>
      </div>

      <MembersView tenantSlug={tenantSlug} />
    </div>
  );
}

export default function MembersPage({ params }: MembersPageProps) {
  return (
    <Suspense fallback={<SectionLoadingFallback sectionKey="classes" />}>
      <MembersContent params={params} />
    </Suspense>
  );
}

