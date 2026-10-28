import { Suspense } from "react";
import { ClassesView } from "@/components/classes";
import { SectionLoadingFallback } from "@/components/layout";

export interface ClassesPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function ClassesContent({ params }: ClassesPageProps) {
  const { tenantSlug } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Quản lý Lớp học & Lịch giảng dạy
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Theo dõi danh sách lớp học, phòng học, giảng viên phụ trách và chi tiết lịch trình các buổi học.
        </p>
      </div>

      <ClassesView tenantSlug={tenantSlug} />
    </div>
  );
}

export default function ClassesPage({ params }: ClassesPageProps) {
  return (
    <Suspense fallback={<SectionLoadingFallback sectionKey="classes" />}>
      <ClassesContent params={params} />
    </Suspense>
  );
}
