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
      {/* Khung chương trình đào tạo tiêu biểu */}
      <CachedCourseCatalog tenantSlug={tenantSlug} />

      {/* Danh mục Khóa học của Trung tâm */}
      <section className="space-y-4">
        <div className="border-b border-neutral-200 pb-3 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Danh mục Khóa học & Đào tạo
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Theo dõi danh sách chương trình đào tạo, học phí tiêu chuẩn và thiết lập tuyển sinh cho trung tâm.
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
