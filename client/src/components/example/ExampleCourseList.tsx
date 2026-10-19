"use client";

import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { useExampleCourses } from "@/hooks/useExampleCourses";
import { formatCurrency } from "@/lib/utils";

/**
 * Component ví dụ minh họa tích hợp SWR với Service Layer
 * Quản lý trọn vẹn 3 trạng thái: isLoading, isError, data mà không cần viết try-catch
 */
export function ExampleCourseList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const t = useAppSelector((state) => state.language.t);
  const currentLanguage = useAppSelector(
    (state) => state.language.currentLanguage
  );

  // Gọi Custom Hook bọc SWR
  const {
    courses,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isError,
    isValidating,
    mutate,
  } = useExampleCourses({ page, pageSize: 6, search: search.trim() || undefined });

  return (
    <div className="space-y-6">
      {/* Search Bar & Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset trang khi tìm kiếm
            }}
            placeholder={t.courses.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {t.courses.clearSearch}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Nút Làm mới dữ liệu (SWR Mutate) */}
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isValidating}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg
              className={`w-3.5 h-3.5 ${isValidating ? "animate-spin text-indigo-600" : "text-slate-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isValidating ? t.courses.updating : t.courses.refreshSwr}</span>
          </button>
        </div>
      </div>

      {/* 1. Trạng thái Loading ban đầu */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-slate-200 bg-slate-100 p-5 dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      )}

      {/* 2. Trạng thái Lỗi */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-bold">{t.courses.loadingFailed}</h4>
              <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">
                {t.courses.defaultErrorMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="mt-4 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            {t.courses.tryAgain}
          </button>
        </div>
      )}

      {/* 3. Trạng thái có Dữ liệu */}
      {!isLoading && !isError && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                      {course.level}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        course.isActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {t.courses.courseFee}
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(
                        course.tuitionFee,
                        currentLanguage === "vi" ? "VND" : "USD",
                        currentLanguage === "vi" ? "vi-VN" : "en-US"
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/60 transition"
                  >
                    {t.courses.viewDetails}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Phân trang mẫu */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800 text-xs text-slate-500">
            <span>
              {t.courses.totalCoursesPrefix} {totalItems} {t.courses.coursesCountSuffix}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPreviousPage && page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800"
              >
                {t.courses.previousPage}
              </button>
              <span className="px-2 py-1 font-semibold text-slate-700 dark:text-slate-300">
                {t.courses.pagePrefix} {page} / {totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage && page >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800"
              >
                {t.courses.nextPage}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 4. Trạng thái rỗng */}
      {!isLoading && !isError && courses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
          <p className="text-sm text-slate-500">{t.courses.noCoursesFound}</p>
        </div>
      )}
    </div>
  );
}
