"use client";

import { useState, useTransition } from "react";
import { revalidateCoursesAction } from "@/actions/cacheActions";

interface RevalidateCacheButtonProps {
  tenantSlug: string;
}

export function RevalidateCacheButton({ tenantSlug }: RevalidateCacheButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [lastRevalidated, setLastRevalidated] = useState<string | null>(null);

  const handleRevalidate = () => {
    startTransition(async () => {
      try {
        const result = await revalidateCoursesAction(tenantSlug);
        if (result.success) {
          const time = new Date(result.revalidatedAt).toLocaleTimeString();
          setLastRevalidated(time);
        }
      } catch (error) {
        console.error("Failed to revalidate cache tag:", error);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleRevalidate}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Revalidate course catalog cache"
      >
        <svg
          className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>{isPending ? "Purging Cache..." : "Revalidate Cache Tag"}</span>
      </button>

      {lastRevalidated && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Revalidated at {lastRevalidated}
        </span>
      )}
    </div>
  );
}
