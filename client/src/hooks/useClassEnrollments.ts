import useSWR, { type SWRConfiguration } from "swr";
import { classService } from "@/services/classService";
import { ROUTES } from "@/constants/routes";
import type { ClassEnrollment } from "@/types/attendance";
import type { AppApiError } from "@/lib/axios";

/**
 * Custom hook lấy danh sách học viên đã ghi danh vào lớp
 * SWR Key: [ROUTES.API.CLASSES.ENROLLMENTS(classId), tenantSlug]
 */
export function useClassEnrollments(
  classId: string | null,
  tenantSlug?: string,
  config?: SWRConfiguration<ClassEnrollment[], AppApiError>
) {
  const key = classId
    ? [ROUTES.API.CLASSES.ENROLLMENTS(classId), tenantSlug ?? "default"]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ClassEnrollment[],
    AppApiError
  >(key, () => (classId ? classService.getEnrollments(classId) : Promise.resolve([])), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    ...config,
  });

  return {
    enrollments: data ?? [],
    totalEnrollments: data?.length ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}
