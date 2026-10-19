"use client";

import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/store/hooks";
import { LanguageSwitcher } from "@/components/common";

export function HomeView() {
  const t = useAppSelector((state) => state.language.t);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black relative">
      {/* Language Switcher Bar at top right */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageSwitcher />
      </div>

      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt={t.common.logoAlt}
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {t.home.gettingStarted}{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              page.tsx
            </code>{" "}
            {t.home.editInstruction}
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {t.home.exploreInstructions}{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50 hover:underline"
            >
              {t.home.templates}
            </a>{" "}
            {t.home.orThe}{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50 hover:underline"
            >
              {t.home.learningCenter}
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 md:w-auto"
            href={ROUTES.AUTH.LOGIN}
          >
            {t.home.loginButton} →
          </Link>
          <a
            className="flex h-12 w-full items-center justify-center rounded-xl border border-solid border-slate-200 px-5 text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 md:w-auto"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.home.documentation}
          </a>
        </div>
      </main>
    </div>
  );
}
