"use client";

import { useAppSelector } from "@/store/hooks";

export interface WorkspaceSectionViewProps {
  sectionKey: "classes" | "schedule" | "attendance";
  tenantSlug: string;
}

export function WorkspaceSectionView({
  sectionKey,
  tenantSlug,
}: WorkspaceSectionViewProps) {
  const t = useAppSelector((state) => state.language.t);
  const currentLanguage = useAppSelector(
    (state) => state.language.currentLanguage
  );

  const meta = {
    classes: {
      title: t.navigation.classes,
      desc: t.sections.classesDesc,
      icon: (
        <svg
          className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.198A5.971 5.971 0 006 18.72m9-11.22a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
    },
    schedule: {
      title: t.navigation.schedule,
      desc: t.sections.scheduleDesc,
      icon: (
        <svg
          className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
          />
        </svg>
      ),
    },
    attendance: {
      title: t.navigation.attendance,
      desc: t.sections.attendanceDesc,
      icon: (
        <svg
          className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
          />
        </svg>
      ),
    },
  }[sectionKey];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>{tenantSlug}</span>
            <span>•</span>
            <span>{t.sections.workspaceSubtitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            {meta.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {meta.desc}
          </p>
        </div>
      </div>

      {/* Feature Content Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 shadow-sm">
          {meta.icon}
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          {currentLanguage === "vi"
            ? `${t.sections.moduleSuffix} ${meta.title}`
            : `${meta.title} ${t.sections.moduleSuffix}`}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {meta.desc} {t.sections.integratedDesc}{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {tenantSlug}
          </span>
          .
        </p>
      </div>
    </div>
  );
}

export default WorkspaceSectionView;
