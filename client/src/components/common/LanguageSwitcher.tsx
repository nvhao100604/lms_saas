"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleLanguage } from "@/store/slices/languageSlice";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const t = useAppSelector((state) => state.language.t);

  const targetLanguageLabel =
    currentLanguage === "vi" ? t.common.english : t.common.vietnamese;

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleLanguage())}
      aria-label={`${t.common.switchLanguageAria} (${targetLanguageLabel})`}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
    >
      <svg
        className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <span className="uppercase tracking-wider font-mono font-bold">
        {currentLanguage === "vi" ? "VI" : "EN"}
      </span>
      <span className="text-[10px] text-slate-400 font-normal">
        {currentLanguage === "vi" ? t.common.vietnamese : t.common.english}
      </span>
    </button>
  );
}
