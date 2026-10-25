import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/constants/cacheTags";
import { RevalidateCacheButton } from "./RevalidateCacheButton";

export interface CachedCourseCatalogProps {
  tenantSlug: string;
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  durationWeeks: number;
  totalLessons: number;
  category: string;
  tuitionFee: number;
}

/**
 * Cached Course Catalog Server Component.
 * Demonstrates Next.js 16 `"use cache"` directive combined with custom `cacheLife` profiles
 * and on-demand `cacheTag` invalidation.
 */
export async function CachedCourseCatalog({ tenantSlug }: CachedCourseCatalogProps) {
  "use cache";
  cacheLife("courses");
  cacheTag(CACHE_TAGS.courses(tenantSlug), CACHE_TAGS.tenant(tenantSlug));

  // Generated timestamp embedded in cache output to visualize cache hits/revalidations
  const cachedAt = new Date().toISOString();

  // Simulated static course items for the tenant's curriculum
  const courses: CourseItem[] = [
    {
      id: "course-101",
      title: "IELTS Intensive Masterclass",
      description:
        "Comprehensive 4-skill preparation course targeting band 7.5+ with native speaking labs.",
      level: "Advanced",
      durationWeeks: 12,
      totalLessons: 48,
      category: "Test Prep",
      tuitionFee: 12500000,
    },
    {
      id: "course-102",
      title: "Business Communication & Presentation",
      description:
        "Professional English curriculum designed for executive meetings, negotiations, and pitches.",
      level: "Intermediate",
      durationWeeks: 8,
      totalLessons: 32,
      category: "Professional",
      tuitionFee: 8900000,
    },
    {
      id: "course-103",
      title: "General English & Grammar Fundamentals",
      description:
        "Foundational grammar, vocabulary expansion, and practical daily conversation drills.",
      level: "Beginner",
      durationWeeks: 10,
      totalLessons: 40,
      category: "Foundation",
      tuitionFee: 6500000,
    },
  ];

  return (
    <section className="space-y-6">
      {/* Cache Component Header & Metadata Banner */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Next.js 16 Cache Component
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Profile: courses (stale 300s, revalidate 900s)
              </span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Cached Curriculum Catalog
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Rendered & cached at: <code className="font-mono text-neutral-700 dark:text-neutral-300">{cachedAt}</code>
            </p>
          </div>

          <RevalidateCacheButton tenantSlug={tenantSlug} />
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <article
            key={course.id}
            className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {course.category}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    course.level === "Advanced"
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                      : course.level === "Intermediate"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  }`}
                >
                  {course.level}
                </span>
              </div>

              <h4 className="mt-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {course.title}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-2">
                {course.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.durationWeeks} weeks
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {course.totalLessons} lessons
                </span>
              </div>

              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(course.tuitionFee)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
