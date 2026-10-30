import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type {
  DashboardSummaryResponse,
  SubscriptionPlanItemResponse,
  SubscriptionQuotaResponse,
  ChangeSubscriptionPlanRequest,
} from "@/types/dashboard";

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

  /**
   * Lấy danh sách các gói cước để nâng cấp/đổi gói
   */
  getSubscriptionPlans: async (): Promise<SubscriptionPlanItemResponse[]> => {
    const res = await api.get<ApiResponse<SubscriptionPlanItemResponse[]>>(
      ROUTES.API.DASHBOARD.PLANS
    );
    if (!res.data) {
      throw new Error(res.message || "Không thể tải danh sách gói cước");
    }
    return res.data;
  },

  /**
   * Đổi hoặc nâng cấp gói cước trung tâm
   */
  changeSubscriptionPlan: async (
    payload: ChangeSubscriptionPlanRequest
  ): Promise<SubscriptionQuotaResponse> => {
    const res = await api.patch<ApiResponse<SubscriptionQuotaResponse>>(
      ROUTES.API.DASHBOARD.SUBSCRIPTION,
      payload
    );
    if (!res.data) {
      throw new Error(res.message || "Không thể đổi gói cước");
    }
    return res.data;
  },
};

export default dashboardService;
