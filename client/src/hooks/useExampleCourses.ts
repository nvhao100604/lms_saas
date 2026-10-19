import useSWR, { type SWRConfiguration } from "swr";
import {
  exampleService,
  type ExampleCourse,
  type ExampleQueryParams,
} from "@/services/exampleService";
import type { PaginatedResponse } from "@/types";
import type { AppApiError } from "@/lib/axios";

/**
 * Custom hook standardizing course list fetching with SWR
 * Leverages caching, revalidation on focus, and automatic state management
 */
export function useExampleCourses(
  params?: ExampleQueryParams,
  config?: SWRConfiguration
) {
  // SWR Key: When params change, SWR automatically refetches
  const key = ["/courses", params?.page, params?.pageSize, params?.search];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    PaginatedResponse<ExampleCourse>,
    AppApiError
  >(
    key,
    () => exampleService.getCourses(params),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      ...config,
    }
  );

  return {
    courses: data?.items ?? [],
    totalItems: data?.totalItems ?? 0,
    currentPage: data?.currentPage ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNextPage: data?.hasNextPage ?? false,
    hasPreviousPage: data?.hasPreviousPage ?? false,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}

/**
 * Custom hook retrieving single course details with SWR
 */
export function useExampleCourse(id?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ExampleCourse,
    AppApiError
  >(
    id ? `/courses/${id}` : null,
    () => exampleService.getCourseById(id!),
    config
  );

  return {
    course: data,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
  };
}
