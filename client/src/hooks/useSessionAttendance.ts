import useSWR, { type SWRConfiguration } from "swr";
import { attendanceService } from "@/services/attendanceService";
import { ROUTES } from "@/constants/routes";
import type { SessionAttendanceSheet } from "@/types/attendance";
import type { AppApiError } from "@/lib/axios";

/**
 * Custom hook lấy sổ điểm danh buổi học
 * SWR Key: [ROUTES.API.SESSIONS.ATTENDANCES(sessionId), tenantSlug]
 */
export function useSessionAttendance(
  sessionId: string | null,
  tenantSlug?: string,
  config?: SWRConfiguration<SessionAttendanceSheet, AppApiError>
) {
  const key = sessionId
    ? [ROUTES.API.SESSIONS.ATTENDANCES(sessionId), tenantSlug ?? "default"]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    SessionAttendanceSheet,
    AppApiError
  >(
    key,
    () => (sessionId ? attendanceService.getSessionAttendance(sessionId) : Promise.reject(new Error("No session ID"))),
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
      ...config,
    }
  );

  return {
    sheet: data ?? null,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}
