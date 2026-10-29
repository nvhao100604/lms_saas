export type NotificationType =
  | "ClassAssigned"
  | "AttendanceAbsent"
  | "SystemAlert";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export type NotificationResponse = NotificationItem;

export interface NotificationSummaryResponse {
  unreadCount: number;
  items: NotificationItem[];
}

