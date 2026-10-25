import useSWR, { type SWRConfiguration } from "swr";
import { classService } from "@/services/classService";
import { memberService } from "@/services/memberService";
import { ROUTES } from "@/constants/routes";
import type { ClassResponse, TenantTeacherResponse } from "@/types/class";
import type { AppApiError } from "@/lib/axios";

/**
 * Custom hook quản lý danh sách lớp học với SWR
 * - Tự động revalidate on focus và reconnect
 * - SWR Key: [ROUTES.API.CLASSES.ROOT, tenantSlug]
 */
export function useClasses(
  tenantSlug?: string,
  config?: SWRConfiguration<ClassResponse[], AppApiError>
) {
  const key = [ROUTES.API.CLASSES.ROOT, tenantSlug ?? "default"];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ClassResponse[],
    AppApiError
  >(key, () => classService.getClasses(), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    ...config,
  });

  return {
    classes: data ?? [],
    totalClasses: data?.length ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}

/**
 * Custom hook lấy chi tiết 1 lớp học kèm danh sách buổi học (sessions)
 * Phục vụ Drawer / Modal xem chi tiết lịch học của một lớp
 */
export function useClassDetail(
  classId: string | null,
  tenantSlug?: string,
  config?: SWRConfiguration<ClassResponse, AppApiError>
) {
  const key = classId
    ? [ROUTES.API.CLASSES.DETAIL(classId), tenantSlug ?? "default"]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ClassResponse,
    AppApiError
  >(key, () => classService.getClassById(classId!), config);

  return {
    classDetail: data,
    sessions: data?.sessions ?? [],
    totalSessions: data?.totalSessions ?? data?.sessions?.length ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}

/**
 * Custom hook lấy danh sách Giảng viên & Admin để gán vào lớp học
 * SWR Key: [ROUTES.API.MEMBERS.TEACHERS, tenantSlug]
 */
export function useTeachers(
  tenantSlug?: string,
  config?: SWRConfiguration<TenantTeacherResponse[], AppApiError>
) {
  const key = [ROUTES.API.MEMBERS.TEACHERS, tenantSlug ?? "default"];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    TenantTeacherResponse[],
    AppApiError
  >(key, () => memberService.getTeachers(), {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    ...config,
  });

  return {
    teachers: data ?? [],
    totalTeachers: data?.length ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}

