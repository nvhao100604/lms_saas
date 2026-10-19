import { Suspense } from "react";
import { WorkspaceSectionView, SectionLoadingFallback } from "@/components/layout";

export interface ClassesPageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function ClassesContent({ params }: ClassesPageProps) {
  const { tenantSlug } = await params;
  return <WorkspaceSectionView sectionKey="classes" tenantSlug={tenantSlug} />;
}

export default function ClassesPage({ params }: ClassesPageProps) {
  return (
    <Suspense fallback={<SectionLoadingFallback sectionKey="classes" />}>
      <ClassesContent params={params} />
    </Suspense>
  );
}
