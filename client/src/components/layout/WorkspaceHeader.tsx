"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/store/hooks";
import { LanguageSwitcher } from "@/components/common";
import { authService } from "@/services/authService";

export interface WorkspaceHeaderProps {
  tenantSlug: string;
  onToggleMobileMenu: () => void;
}

export function WorkspaceHeader({
  tenantSlug,
  onToggleMobileMenu,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const t = useAppSelector((state) => state.language.t);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Format tenant slug into clean display name (e.g. "apex-english" -> "Apex English")
  const formattedTenantTitle = tenantSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout to allow client redirection
    } finally {
      router.push(ROUTES.AUTH.LOGIN);
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85 sm:px-6">
      {/* Left: Mobile trigger & Workspace badge */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={t.navigation.toggleMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Workspace Badge / Breadcrumb */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.navigation.workspaceBadge}:
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {formattedTenantTitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Language Switcher, Switch Workspace, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Switch Workspace Button */}
        <Link
          href={ROUTES.AUTH.LOGIN}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title={t.navigation.switchWorkspace}
        >
          <svg
            className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <span className="hidden md:inline">{t.navigation.switchWorkspace}</span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label={t.navigation.logout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50/60 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 disabled:opacity-50 disabled:pointer-events-none dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          title={t.navigation.logout}
        >
          {isLoggingOut ? (
            <svg
              className="h-3.5 w-3.5 animate-spin text-rose-600 dark:text-rose-400"
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
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          )}
          <span className="hidden md:inline">
            {isLoggingOut ? t.navigation.loggingOut : t.navigation.logout}
          </span>
        </button>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
