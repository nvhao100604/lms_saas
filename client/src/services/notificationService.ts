import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type { NotificationSummaryResponse } from "@/types/notification";

export const notificationService = {
  getNotifications: async (): Promise<NotificationSummaryResponse> => {
    const res = await api.get<ApiResponse<NotificationSummaryResponse>>(
      ROUTES.API.NOTIFICATIONS.ROOT
    );
    return res.data ?? { unreadCount: 0, items: [] };
  },

  markAsRead: async (id: string): Promise<boolean> => {
    const res = await api.patch<ApiResponse<boolean>>(
      ROUTES.API.NOTIFICATIONS.MARK_READ(id)
    );
    return res.data ?? true;
  },

  markAllAsRead: async (): Promise<boolean> => {
    const res = await api.patch<ApiResponse<boolean>>(
      ROUTES.API.NOTIFICATIONS.MARK_ALL_READ
    );
    return res.data ?? true;
  },
};

export default notificationService;

