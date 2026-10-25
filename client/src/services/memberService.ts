import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type { TenantTeacherResponse } from "@/types/class";

/**
 * Service Layer cho thành viên trung tâm (Teachers, Admins)
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
};

export default memberService;
