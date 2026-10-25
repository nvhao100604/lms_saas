import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type {
  CourseResponse,
  CreateCourseRequest,
  PatchCourseRequest,
} from "@/types/course";

/**
 * Service Layer (Thin API Layer) cho phân hệ Khóa học (Courses)
 * - Tận dụng Axios Interceptors chuẩn hóa lỗi và tự động xoay vòng token 401
 * - Tuyệt đối không dùng try-catch thủ công tại Service Layer
 */
export const courseService = {
  /**
   * Lấy danh sách khóa học thuộc trung tâm hiện tại
   */
  getCourses: async (): Promise<CourseResponse[]> => {
    const res = await api.get<ApiResponse<CourseResponse[]>>(
      ROUTES.API.COURSES.ROOT
    );
    return res.data ?? [];
  },

  /**
   * Lấy thông tin chi tiết một khóa học theo Id
   */
  getCourseById: async (id: string): Promise<CourseResponse> => {
    const res = await api.get<ApiResponse<CourseResponse>>(
      ROUTES.API.COURSES.DETAIL(id)
    );
    return res.data!;
  },

  /**
   * Tạo mới khóa học (Dành cho CenterAdmin)
   */
  createCourse: async (
    payload: CreateCourseRequest
  ): Promise<CourseResponse> => {
    const res = await api.post<ApiResponse<CourseResponse>>(
      ROUTES.API.COURSES.ROOT,
      payload
    );
    return res.data!;
  },

  /**
   * Cập nhật từng phần khóa học qua HTTP PATCH (Dành cho CenterAdmin)
   */
  patchCourse: async (
    id: string,
    payload: PatchCourseRequest
  ): Promise<CourseResponse> => {
    const res = await api.patch<ApiResponse<CourseResponse>>(
      ROUTES.API.COURSES.DETAIL(id),
      payload
    );
    return res.data!;
  },

  /**
   * Xóa khóa học theo Id (Chặn nếu có lớp học trực thuộc)
   */
  deleteCourse: async (id: string): Promise<{ id: string }> => {
    await api.delete<ApiResponse<unknown>>(ROUTES.API.COURSES.DETAIL(id));
    return { id };
  },
};

export default courseService;
