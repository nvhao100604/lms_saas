import useSWR, { type SWRConfiguration } from "swr";
import { memberService } from "@/services/memberService";
import { ROUTES } from "@/constants/routes";
import type { TenantStudent } from "@/types/attendance";
import type { AppApiError } from "@/lib/axios";

/**
 * Custom hook lấy danh sách học viên trong trung tâm
 * SWR Key: [ROUTES.API.MEMBERS.STUDENTS, tenantSlug]
 */
export function useStudents(
  tenantSlug?: string,
  config?: SWRConfiguration<TenantStudent[], AppApiError>
) {
  const key = [ROUTES.API.MEMBERS.STUDENTS, tenantSlug ?? "default"];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    TenantStudent[],
    AppApiError
  >(key, () => memberService.getStudents(), {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    ...config,
  });

  return {
    students: data ?? [],
    totalStudents: data?.length ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}
