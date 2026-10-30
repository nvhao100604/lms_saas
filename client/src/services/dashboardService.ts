import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type { DashboardSummaryResponse } from "@/types/dashboard";

/**
 * Service Layer cho Bảng điều khiển Thống kê Trung tâm (Dashboard)
 */
export const dashboardService = {
  /**
   * Lấy toàn bộ số liệu thống kê tổng quan của trung tâm
   */
  getDashboardSummary: async (): Promise<DashboardSummaryResponse> => {
    const res = await api.get<ApiResponse<DashboardSummaryResponse>>(
      ROUTES.API.DASHBOARD.ROOT
    );
    if (!res.data) {
      throw new Error(res.message || "Không thể tải dữ liệu bảng điều khiển");
    }
    return res.data;
  },
};

export default dashboardService;
