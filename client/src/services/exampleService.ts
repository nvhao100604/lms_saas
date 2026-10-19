import { axiosClient, api } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types";

export interface ExampleCourse {
  id: string;
  title: string;
  description: string;
  tuitionFee: number;
  level: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateExampleCoursePayload {
  title: string;
  description: string;
  tuitionFee: number;
  level: string;
}

export interface UpdateExampleCoursePayload {
  title?: string;
  description?: string;
  tuitionFee?: number;
  level?: string;
  isActive?: boolean;
}

export interface ExampleQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Service Layer (Thin API Layer) for Course / Sample Data entity
 * - No manual try-catch needed: All errors (401, 403, 500...) are
 *   automatically intercepted by response interceptors in axios.ts, handling token refresh and standardizing errors.
 */
export const exampleService = {
  /**
   * Get paginated course list
   */
  getCourses: async (
    params?: ExampleQueryParams
  ): Promise<PaginatedResponse<ExampleCourse>> => {
    const response = await axiosClient.get<
      ApiResponse<PaginatedResponse<ExampleCourse>>
    >("/courses", { params });
    return response.data.data!;
  },

  /**
   * Get course details by ID
   */
  getCourseById: async (id: string): Promise<ExampleCourse> => {
    const response = await axiosClient.get<ApiResponse<ExampleCourse>>(
      `/courses/${id}`
    );
    return response.data.data!;
  },

  /**
   * Create new course
   */
  createCourse: async (
    payload: CreateExampleCoursePayload
  ): Promise<ExampleCourse> => {
    return api.post<ExampleCourse>("/courses", payload);
  },

  /**
   * Update course by ID
   */
  updateCourse: async (
    id: string,
    payload: UpdateExampleCoursePayload
  ): Promise<ExampleCourse> => {
    return api.put<ExampleCourse>(`/courses/${id}`, payload);
  },

  /**
   * Delete course by ID
   */
  deleteCourse: async (id: string): Promise<{ success: boolean }> => {
    return api.delete<{ success: boolean }>(`/courses/${id}`);
  },
};

/**
 * Standard fetcher for SWR (binds directly with endpoint key)
 */
export const exampleSwrFetcher = async <T>(url: string): Promise<T> => {
  return api.get<T>(url);
};
