import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type {
  ClassResponse,
  CreateClassRequest,
  PatchClassRequest,
} from "@/types/class";
import type { ClassEnrollment } from "@/types/attendance";

/**
 * Service Layer (Thin API Layer) cho phân hệ Lớp học (Classes)
 * - Tận dụng Axios Interceptors chuẩn hóa lỗi và tự động xoay vòng token 401
 * - Bắt trọn thông điệp lỗi nghiệp vụ (hạn ngạch gói cước, trùng lịch) trong AppApiError.message
 */
export const classService = {
  /**
   * Lấy danh sách lớp học thuộc trung tâm hiện tại
   */
  getClasses: async (): Promise<ClassResponse[]> => {
    const res = await api.get<ApiResponse<ClassResponse[]>>(
      ROUTES.API.CLASSES.ROOT
    );
    return res.data ?? [];
  },

  /**
   * Lấy chi tiết lớp học kèm danh sách buổi học (ClassSessions)
   */
  getClassById: async (id: string): Promise<ClassResponse> => {
    const res = await api.get<ApiResponse<ClassResponse>>(
      ROUTES.API.CLASSES.DETAIL(id)
    );
    return res.data!;
  },

  /**
   * Mở lớp học mới (kích hoạt kiểm tra hạn ngạch, sinh lịch học, chống trùng lịch)
   */
  createClass: async (payload: CreateClassRequest): Promise<ClassResponse> => {
    const res = await api.post<ApiResponse<ClassResponse>>(
      ROUTES.API.CLASSES.ROOT,
      payload
    );
    return res.data!;
  },

  /**
   * Cập nhật thông tin hành chính lớp học qua HTTP PATCH
   */
  patchClass: async (
    id: string,
    payload: PatchClassRequest
  ): Promise<ClassResponse> => {
    const res = await api.patch<ApiResponse<ClassResponse>>(
      ROUTES.API.CLASSES.DETAIL(id),
      payload
    );
    return res.data!;
  },

  /**
   * Lấy danh sách học viên ghi danh vào lớp
   */
  getEnrollments: async (classId: string): Promise<ClassEnrollment[]> => {
    const res = await api.get<ApiResponse<ClassEnrollment[]>>(
      ROUTES.API.CLASSES.ENROLLMENTS(classId)
    );
    return res.data ?? [];
  },

  /**
   * Ghi danh học viên vào lớp học
   */
  enrollStudent: async (
    classId: string,
    studentId: string
  ): Promise<ClassEnrollment> => {
    const res = await api.post<ApiResponse<ClassEnrollment>>(
      ROUTES.API.CLASSES.ENROLLMENTS(classId),
      { studentId }
    );
    return res.data!;
  },

  /**
   * Hủy ghi danh học viên khỏi lớp học
   */
  removeEnrollment: async (
    classId: string,
    studentId: string
  ): Promise<boolean> => {
    const res = await api.delete<ApiResponse<boolean>>(
      ROUTES.API.CLASSES.REMOVE_ENROLLMENT(classId, studentId)
    );
    return res.data ?? true;
  },
};

export default classService;

