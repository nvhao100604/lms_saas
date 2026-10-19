import { Suspense } from "react";
import { WorkspaceSectionView, SectionLoadingFallback } from "@/components/layout";

export interface SchedulePageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function ScheduleContent({ params }: SchedulePageProps) {
  const { tenantSlug } = await params;
  return <WorkspaceSectionView sectionKey="schedule" tenantSlug={tenantSlug} />;
}

export default function SchedulePage({ params }: SchedulePageProps) {
  return (
    <Suspense fallback={<SectionLoadingFallback sectionKey="schedule" />}>
      <ScheduleContent params={params} />
    </Suspense>
  );
}
