import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type { ScheduleFilterParams, ScheduleSession } from "@/types/schedule";

/**
 * Service Layer cho Thời khóa biểu tuần
 */
export const scheduleService = {
  /**
   * Lấy lịch học theo khoảng ngày và bộ lọc vai trò
   */
  getSchedule: async (
    params: ScheduleFilterParams = {}
  ): Promise<ScheduleSession[]> => {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.classId) searchParams.set("classId", params.classId);
    if (params.teacherId) searchParams.set("teacherId", params.teacherId);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${ROUTES.API.SCHEDULE.ROOT}?${queryString}`
      : ROUTES.API.SCHEDULE.ROOT;

    const res = await api.get<ApiResponse<ScheduleSession[]>>(url);
    return res.data ?? [];
  },
};

export default scheduleService;
