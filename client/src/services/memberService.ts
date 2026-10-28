import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type { TenantTeacherResponse } from "@/types/class";
import type { TenantStudent } from "@/types/attendance";

/**
 * Service Layer cho thành viên trung tâm (Teachers, Admins, Students)
 */
export const memberService = {
  /**
   * Lấy danh sách giảng viên & admin có quyền giảng dạy trong trung tâm
   */
  getTeachers: async (): Promise<TenantTeacherResponse[]> => {
    const res = await api.get<ApiResponse<TenantTeacherResponse[]>>(
      ROUTES.API.MEMBERS.TEACHERS
    );
    return res.data ?? [];
  },

  /**
   * Lấy danh sách học viên trong trung tâm
   */
  getStudents: async (): Promise<TenantStudent[]> => {
    const res = await api.get<ApiResponse<TenantStudent[]>>(
      ROUTES.API.MEMBERS.STUDENTS
    );
    return res.data ?? [];
  },
};

export default memberService;

