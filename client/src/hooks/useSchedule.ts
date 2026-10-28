import useSWR, { type SWRConfiguration } from "swr";
import { scheduleService } from "@/services/scheduleService";
import { ROUTES } from "@/constants/routes";
import type { ScheduleFilterParams, ScheduleSession } from "@/types/schedule";
import type { AppApiError } from "@/lib/axios";

/**
 * Custom hook lấy thời khóa biểu tuần
 * SWR Key: [ROUTES.API.SCHEDULE.ROOT, params, tenantSlug]
 */
export function useSchedule(
  params: ScheduleFilterParams,
  tenantSlug?: string,
  config?: SWRConfiguration<ScheduleSession[], AppApiError>
) {
  const key = [
    ROUTES.API.SCHEDULE.ROOT,
    params.from ?? "",
    params.to ?? "",
    params.classId ?? "",
    params.teacherId ?? "",
    tenantSlug ?? "default",
  ];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ScheduleSession[],
    AppApiError
  >(key, () => scheduleService.getSchedule(params), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    ...config,
  });

  return {
    sessions: data ?? [],
    totalSessions: data?.length ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}
