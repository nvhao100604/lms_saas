import useSWR, { type SWRConfiguration } from "swr";
import { notificationService } from "@/services/notificationService";
import { ROUTES } from "@/constants/routes";
import type { NotificationSummaryResponse } from "@/types/notification";
import type { AppApiError } from "@/lib/axios";

export function useNotifications(
  tenantSlug?: string,
  config?: SWRConfiguration<NotificationSummaryResponse, AppApiError>
) {
  const key = [ROUTES.API.NOTIFICATIONS.ROOT, tenantSlug ?? "default"];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    NotificationSummaryResponse,
    AppApiError
  >(key, () => notificationService.getNotifications(), {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    ...config,
  });

  const markAsRead = async (id: string) => {
    // Optimistic UI mutation
    await mutate(
      (current) => {
        if (!current) return current;
        const target = current.items.find((item) => item.id === id);
        if (!target || target.isRead) return current;

        return {
          unreadCount: Math.max(0, current.unreadCount - 1),
          items: current.items.map((item) =>
            item.id === id ? { ...item, isRead: true } : item
          ),
        };
      },
      false
    );

    try {
      await notificationService.markAsRead(id);
    } finally {
      mutate();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic UI mutation
    await mutate(
      (current) => {
        if (!current) return current;
        return {
          unreadCount: 0,
          items: current.items.map((item) => ({ ...item, isRead: true })),
        };
      },
      false
    );

    try {
      await notificationService.markAllAsRead();
    } finally {
      mutate();
    }
  };

  return {
    notifications: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
    markAsRead,
    markAllAsRead,
  };
}

