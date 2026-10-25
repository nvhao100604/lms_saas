import useSWR, { type SWRConfiguration } from "swr";
import { courseService } from "@/services/courseService";
import { ROUTES } from "@/constants/routes";
import type { CourseResponse } from "@/types/course";
import type { AppApiError } from "@/lib/axios";

/**
 * Custom hook quản lý danh sách khóa học với SWR
 * - Tự động revalidate on focus và reconnect
 * - Tự động cache theo key [ROUTES.API.COURSES.ROOT, tenantSlug]
 */
export function useCourses(
  tenantSlug?: string,
  config?: SWRConfiguration<CourseResponse[], AppApiError>
) {
  const key = [ROUTES.API.COURSES.ROOT, tenantSlug ?? "default"];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    CourseResponse[],
    AppApiError
  >(key, () => courseService.getCourses(), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    ...config,
  });

  return {
    courses: data ?? [],
    totalCourses: data?.length ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}

/**
 * Custom hook lấy chi tiết 1 khóa học theo id với SWR
 */
export function useCourseDetail(
  courseId: string | null,
  tenantSlug?: string,
  config?: SWRConfiguration<CourseResponse, AppApiError>
) {
  const key = courseId
    ? [ROUTES.API.COURSES.DETAIL(courseId), tenantSlug ?? "default"]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    CourseResponse,
    AppApiError
  >(key, () => courseService.getCourseById(courseId!), config);

  return {
    course: data,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}
