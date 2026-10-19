"use client";

import { useAppSelector } from "@/store/hooks";

export interface SectionLoadingFallbackProps {
  sectionKey?: "classes" | "schedule" | "attendance" | "courses";
}

export function SectionLoadingFallback({
  sectionKey,
}: SectionLoadingFallbackProps) {
  const t = useAppSelector((state) => state.language.t);

  const getLabel = () => {
    switch (sectionKey) {
      case "classes":
        return t.sections.loadingClasses;
      case "schedule":
        return t.sections.loadingSchedule;
      case "attendance":
        return t.sections.loadingAttendance;
      case "courses":
        return t.sections.loadingCourses;
      default:
        return t.common.loading;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-2">
        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>

      {/* Feature Content Card Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[220px] text-center shadow-sm">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 mb-4 flex items-center justify-center">
          <svg
            className="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {getLabel()}
        </p>
      </div>
    </div>
  );
}

export default SectionLoadingFallback;
