"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/store/hooks";
import { LanguageSwitcher } from "@/components/common";
import { authService } from "@/services/authService";
import type { TenantSummary } from "@/types/auth";

type Step = "credentials" | "select-tenant" | "auto-redirecting";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  // Nạp từ điển đa ngôn ngữ từ Redux store
  const t = useAppSelector((state) => state.language.t);

  // State quản lý luồng
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // State lưu thông tin sau khi đăng nhập sơ bộ
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState<string>("");

  // Trạng thái tương tác & lỗi
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper chuẩn hóa thông báo lỗi từ backend theo từ điển đa ngôn ngữ Redux
  const getLocalizedAuthError = (
    backendMessage?: string,
    fallback: string = t.auth.invalidCredentialsError
  ): string => {
    if (!backendMessage) return fallback;
    const lower = backendMessage.toLowerCase();
    if (
      lower.includes("invalid email") ||
      lower.includes("invalid password") ||
      lower.includes("credentials")
    ) {
      return t.auth.invalidCredentialsError;
    }
    if (lower.includes("required")) {
      return t.auth.validation.emailRequired;
    }
    if (
      lower.includes("network") ||
      lower.includes("failed to fetch") ||
      lower.includes("connect")
    ) {
      return t.auth.networkError;
    }
    if (
      lower.includes("session") ||
      lower.includes("tenant") ||
      lower.includes("user not found")
    ) {
      return t.auth.sessionError;
    }
    return backendMessage;
  };

  // Giai đoạn 1: Submit Form Đăng nhập
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await authService.login({ email, password });

      if (!result.success || !result.data) {
        setErrorMessage(
          getLocalizedAuthError(result.message, t.auth.invalidCredentialsError)
        );
        setIsLoading(false);
        return;
      }

      const { userId: returnedUserId, fullName, tenants: returnedTenants } = result.data;
      setUserId(returnedUserId);
      setUserName(fullName);
      setTenants(returnedTenants);

      if (returnedTenants.length === 0) {
        setErrorMessage(t.auth.emptyTenantsError);
        setIsLoading(false);
        return;
      }

      // Nếu chỉ có duy nhất 1 trung tâm: Tự động kích hoạt chọn trung tâm
      if (returnedTenants.length === 1) {
        setStep("auto-redirecting");
        const singleTenant = returnedTenants[0];
        setSelectedTenantSlug(singleTenant.tenantSlug);
        await selectTenant(returnedUserId, singleTenant.tenantSlug);
      } else {
        // Có từ 2 trung tâm trở lên: Chuyển sang màn hình chọn trung tâm
        setStep("select-tenant");
        setIsLoading(false);
      }
    } catch {
      setErrorMessage(t.auth.networkError);
      setIsLoading(false);
    }
  };

  // Giai đoạn 2: Chọn trung tâm & thiết lập HttpOnly cookie session
  const selectTenant = async (targetUserId: string, tenantSlug: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedTenantSlug(tenantSlug);

    try {
      const result = await authService.setSession({
        userId: targetUserId,
        tenantSlug,
      });

      if (!result.success) {
        setErrorMessage(
          getLocalizedAuthError(result.message, t.auth.sessionError)
        );
        setStep("select-tenant");
        setIsLoading(false);
        return;
      }

      // Kiểm tra tham số redirect từ Middleware:
      // Nếu có redirectPath và đường dẫn bắt đầu bằng /{tenantSlug} -> điều hướng tới redirectPath
      if (redirectPath && redirectPath.startsWith(`/${result.tenantSlug}`)) {
        router.push(redirectPath);
      } else {
        router.push(ROUTES.TENANT.DASHBOARD(result.tenantSlug));
      }
    } catch {
      setErrorMessage(t.auth.networkError);
      setStep("select-tenant");
      setIsLoading(false);
    }
  };

  // Quay lại bước nhập email/mật khẩu
  const handleResetToLogin = () => {
    setStep("credentials");
    setErrorMessage(null);
    setIsLoading(false);
    setPassword("");
  };

  // Helper hiển thị badge vai trò từ Redux dictionary
  const getRoleBadge = (role: string) => {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole === "admin") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
          {t.roles.admin}
        </span>
      );
    }
    if (normalizedRole === "instructor" || normalizedRole === "teacher") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
          {t.roles.instructor}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
        {t.roles.student}
      </span>
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Language Switcher Top-Right Bar */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Header Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.common.appName}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t.common.tagline}
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 sm:p-8 shadow-xl shadow-slate-900/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 transition-all">
          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <svg
                className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label={t.common.closeErrorAria}
                className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* GIAI ĐOẠN 1: FORM NHẬP EMAIL & MẬT KHẨU */}
          {step === "credentials" && (
            <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {t.auth.signInTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.auth.signInSubtitle}
                </p>
              </div>

              {/* Ô Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.emailPlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  />
                </div>
              </div>

              {/* Ô Mật khẩu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    {t.auth.passwordLabel}
                  </label>
                  <span className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                    {t.auth.forgotPassword}
                  </span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t.common.hidePasswordAria : t.common.showPasswordAria}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Nút Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all duration-150 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    <span>{t.auth.submitting}</span>
                  </>
                ) : (
                  <span>{t.auth.submitButton}</span>
                )}
              </button>
            </form>
          )}

          {/* GIAI ĐOẠN TỰ ĐỘNG CHUYỂN HƯỚNG KHI CHỈ CÓ 1 TRUNG TÂM */}
          {step === "auto-redirecting" && (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <svg
                  className="animate-spin h-7 w-7"
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
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t.auth.initializingWorkspace}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.auth.connectingToTenant}{" "}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {tenants[0]?.tenantName || selectedTenantSlug}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* GIAI ĐOẠN 2: CHỌN TRUNG TÂM (KHI CÓ TỪ 2 TRUNG TÂM TRỞ LÊN) */}
          {step === "select-tenant" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {t.auth.selectTenantTitle}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.auth.selectTenantWelcome}{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {userName || email}
                  </span>
                  ! {t.auth.selectTenantInstruction}
                </p>
              </div>

              {/* Danh sách các trung tâm */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {tenants.map((tenant) => {
                  const isCurrentSelected =
                    isLoading && selectedTenantSlug === tenant.tenantSlug;

                  return (
                    <button
                      key={tenant.tenantId}
                      type="button"
                      disabled={isLoading}
                      onClick={() => selectTenant(userId, tenant.tenantSlug)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isCurrentSelected
                          ? "border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-sm"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors dark:bg-slate-800 dark:text-slate-300">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                            {tenant.tenantName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                              /{tenant.tenantSlug}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            {getRoleBadge(tenant.role)}
                          </div>
                        </div>
                      </div>

                      {/* Icon mũi tên hoặc spinner */}
                      <div className="shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {isCurrentSelected ? (
                          <svg
                            className="animate-spin h-5 w-5 text-indigo-600 dark:text-indigo-400"
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
                        ) : (
                          <svg
                            className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Nút quay lại đổi tài khoản */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleResetToLogin}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>{t.auth.switchAccount}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Note Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {t.common.footerSecurityBadge}
        </p>
      </div>
    </div>
  );
}

// Skeleton fallback cho Next.js App Router prerendering
function LoginSkeleton() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md animate-pulse space-y-6">
        <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-2xl mx-auto" />
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
