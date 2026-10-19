import { Suspense } from "react";
import { WorkspaceSectionView, SectionLoadingFallback } from "@/components/layout";

export interface AttendancePageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function AttendanceContent({ params }: AttendancePageProps) {
  const { tenantSlug } = await params;
  return <WorkspaceSectionView sectionKey="attendance" tenantSlug={tenantSlug} />;
}

export default function AttendancePage({ params }: AttendancePageProps) {
  return (
    <Suspense fallback={<SectionLoadingFallback sectionKey="attendance" />}>
      <AttendanceContent params={params} />
    </Suspense>
  );
}
