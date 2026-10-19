import { Suspense } from "react";
import { ExampleCourseList } from "@/components/example/ExampleCourseList";
import { SectionLoadingFallback } from "@/components/layout";

export interface CoursesPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function CoursesContent({ params }: CoursesPageProps) {
  await params;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <ExampleCourseList />
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
