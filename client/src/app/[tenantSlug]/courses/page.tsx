import { Suspense } from "react";
import { CachedCourseCatalog, CoursesView } from "@/components/courses";
import { SectionLoadingFallback } from "@/components/layout";

export interface CoursesPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function CoursesContent({ params }: CoursesPageProps) {
  const { tenantSlug } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 1. Next.js 16 Cache Component (use cache + cacheLife + cacheTag) */}
      <CachedCourseCatalog tenantSlug={tenantSlug} />

      {/* 2. Client-side Real-time SWR Course Management View */}
      <section className="space-y-4">
        <div className="border-b border-neutral-200 pb-3 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Quản lý Khóa học Trực tiếp (SWR)
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Xem danh sách, tìm kiếm, tạo mới và chỉnh sửa nhanh thông tin học phí & trạng thái tuyển sinh qua HTTP PATCH.
          </p>
        </div>
        <CoursesView tenantSlug={tenantSlug} />
      </section>
    </div>
  );
}

export default function CoursesPage({ params }: CoursesPageProps) {
  return (
    <Suspense fallback={<SectionLoadingFallback sectionKey="courses" />}>
      <CoursesContent params={params} />
    </Suspense>
  );
}
