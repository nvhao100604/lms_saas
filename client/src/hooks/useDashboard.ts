import useSWR, { type SWRConfiguration } from "swr";
import { dashboardService } from "@/services/dashboardService";
import { ROUTES } from "@/constants/routes";
import type { DashboardSummaryResponse } from "@/types/dashboard";
import type { AppApiError } from "@/lib/axios";

/**
 * Custom hook quản lý số liệu bảng điều khiển trung tâm với SWR
 * - Tự động revalidate on focus và reconnect
 * - SWR Key: [ROUTES.API.DASHBOARD.ROOT, tenantSlug]
 */
export function useDashboard(
  tenantSlug?: string,
  config?: SWRConfiguration<DashboardSummaryResponse, AppApiError>
) {
  const key = [ROUTES.API.DASHBOARD.ROOT, tenantSlug ?? "default"];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    DashboardSummaryResponse,
    AppApiError
  >(key, () => dashboardService.getDashboardSummary(), {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
    ...config,
  });

  return {
    dashboard: data,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}
