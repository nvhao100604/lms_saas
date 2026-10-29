import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type { TenantTeacherResponse } from "@/types/class";
import type { TenantStudent } from "@/types/attendance";
import type {
  TenantMemberResponse,
  CreateTenantMemberRequest,
  PatchTenantMemberRequest,
  MemberFilterParams,
} from "@/types/member";

/**
 * Service Layer cho thành viên trung tâm (Teachers, Admins, Students)
 */
export const memberService = {
  /**
   * Lấy danh sách thành viên với bộ lọc vai trò và tìm kiếm
   */
  getMembers: async (
    params?: MemberFilterParams
  ): Promise<TenantMemberResponse[]> => {
    const res = await api.get<ApiResponse<TenantMemberResponse[]>>(
      ROUTES.API.MEMBERS.ROOT,
      { params }
    );
    return res.data ?? [];
  },

  /**
   * Thêm thành viên mới vào trung tâm
   */
  createMember: async (
    payload: CreateTenantMemberRequest
  ): Promise<TenantMemberResponse> => {
    const res = await api.post<ApiResponse<TenantMemberResponse>>(
      ROUTES.API.MEMBERS.ROOT,
      payload
    );
    if (!res.data) {
      throw new Error(res.message || "Không thể thêm thành viên");
    }
    return res.data;
  },

  /**
   * Cập nhật thông tin thành viên (Vai trò, trạng thái kích hoạt, họ tên)
   */
  patchMember: async (
    memberId: string,
    payload: PatchTenantMemberRequest
  ): Promise<TenantMemberResponse> => {
    const res = await api.patch<ApiResponse<TenantMemberResponse>>(
      ROUTES.API.MEMBERS.DETAIL(memberId),
      payload
    );
    if (!res.data) {
      throw new Error(res.message || "Không thể cập nhật thành viên");
    }
    return res.data;
  },

  /**
   * Lấy danh sách giảng viên & admin có quyền giảng dạy trong trung tâm (IsActive = true)
   */
  getTeachers: async (): Promise<TenantTeacherResponse[]> => {
    const res = await api.get<ApiResponse<TenantTeacherResponse[]>>(
      ROUTES.API.MEMBERS.TEACHERS
    );
    return res.data ?? [];
  },

  /**
   * Lấy danh sách học viên trong trung tâm (IsActive = true)
   */
  getStudents: async (): Promise<TenantStudent[]> => {
    const res = await api.get<ApiResponse<TenantStudent[]>>(
      ROUTES.API.MEMBERS.STUDENTS
    );
    return res.data ?? [];
  },
};

export default memberService;
