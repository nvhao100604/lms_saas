import { Suspense } from "react";
import { AttendanceView } from "@/components/attendance/AttendanceView";
import { SectionLoadingFallback } from "@/components/layout";

export interface AttendancePageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

async function AttendanceContent({ params }: AttendancePageProps) {
  const { tenantSlug } = await params;
  return <AttendanceView tenantSlug={tenantSlug} />;
}

export default function AttendancePage({ params }: AttendancePageProps) {
  return (
    <Suspense fallback={<SectionLoadingFallback sectionKey="attendance" />}>
      <AttendanceContent params={params} />
    </Suspense>
  );
}
