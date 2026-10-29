"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppSelector } from "@/store/hooks";
import type { NotificationItem, NotificationType } from "@/types/notification";
import type { NotificationTranslations, SupportedLanguage } from "@/locales/types";

export interface NotificationBellProps {
  tenantSlug: string;
}

/**
 * Định dạng thời gian tương đối hỗ trợ song ngữ (VI / EN)
 */
function formatRelativeTime(
  dateString: string,
  currentLanguage: SupportedLanguage,
  tNotif: NotificationTranslations
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return tNotif.justNow;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${tNotif.minutesAgo}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${tNotif.hoursAgo}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return tNotif.yesterday;
  }
  if (diffInDays < 7) {
    return `${diffInDays} ${tNotif.daysAgo}`;
  }

  // Định dạng ngày cụ thể
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return currentLanguage === "en"
    ? `${month}/${day}/${year}`
    : `${day}/${month}/${year}`;
}

/**
 * Trả về Icon tương ứng với loại thông báo
 */
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "ClassAssigned":
      return (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "primary.50",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SchoolRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
      );
    case "AttendanceAbsent":
      return (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "warning.50",
            color: "warning.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <EventBusyRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
      );
    case "SystemAlert":
    default:
      return (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "info.50",
            color: "info.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <InfoRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
      );
  }
}

export function NotificationBell({ tenantSlug }: NotificationBellProps) {
  const router = useRouter();
  const t = useAppSelector((state) => state.language.t);
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(tenantSlug);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    handleClose();
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const handleMarkAllClick = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const isOpen = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={t.notifications.title}>
        <IconButton
          onClick={handleOpen}
          aria-label={t.notifications.ariaLabel}
          aria-haspopup="true"
          aria-expanded={isOpen}
          sx={{
            border: "1px solid",
            borderColor: isOpen ? "primary.main" : "divider",
            bgcolor: isOpen ? "rgba(79, 70, 229, 0.08)" : "transparent",
            borderRadius: 2,
            p: 0.75,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: "grey.100",
              borderColor: "grey.400",
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.65rem",
                fontWeight: 700,
                minWidth: 16,
                height: 16,
                px: 0.5,
              },
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsRoundedIcon sx={{ fontSize: 20, color: "text.primary" }} />
            ) : (
              <NotificationsNoneRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "calc(100vw - 32px)", sm: 380 },
              maxWidth: 400,
              maxHeight: 520,
              mt: 1.5,
              borderRadius: 3,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t.notifications.title}
            </Typography>
            {unreadCount > 0 && (
              <Box
                sx={{
                  bgcolor: "rgba(79, 70, 229, 0.1)",
                  color: "primary.main",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1.5,
                }}
              >
                {unreadCount} {t.notifications.newBadge}
              </Box>
            )}
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllClick}
              disabled={isMarkingAll}
              startIcon={
                isMarkingAll ? (
                  <CircularProgress size={12} color="inherit" />
                ) : (
                  <DoneAllRoundedIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                fontSize: "0.75rem",
                textTransform: "none",
                fontWeight: 600,
                color: "primary.main",
                py: 0.25,
                px: 1,
              }}
            >
              {t.notifications.markAllAsRead}
            </Button>
          )}
        </Box>

        <Divider />

        {/* Content list */}
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          {isLoading && notifications.length === 0 ? (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                p: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: "grey.50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.disabled",
                }}
              >
                <NotificationsNoneRoundedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                {t.notifications.emptyTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", maxWidth: 240 }}>
                {t.notifications.emptyDesc}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((item, index) => {
                const isUnread = !item.isRead;
                return (
                  <Box key={item.id}>
                    <ListItemButton
                      onClick={() => handleItemClick(item)}
                      sx={{
                        p: 1.75,
                        alignItems: "flex-start",
                        gap: 1.5,
                        bgcolor: isUnread ? "rgba(79, 70, 229, 0.04)" : "transparent",
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                          bgcolor: isUnread
                            ? "rgba(79, 70, 229, 0.08)"
                            : "rgba(0, 0, 0, 0.03)",
                        },
                      }}
                    >
                      {getNotificationIcon(item.type)}

                      <ListItemText
                        disableTypography
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isUnread ? 700 : 500,
                                color: isUnread ? "text.primary" : "text.secondary",
                                fontSize: "0.85rem",
                              }}
                            >
                              {item.title}
                            </Typography>
                            {isUnread && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: "primary.main",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: isUnread ? "text.primary" : "text.secondary",
                                fontSize: "0.8rem",
                                lineHeight: 1.4,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {item.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.disabled",
                                fontSize: "0.7rem",
                                fontWeight: 500,
                              }}
                            >
                              {formatRelativeTime(item.createdAt, currentLanguage, t.notifications)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {index < notifications.length - 1 && <Divider component="li" />}
                  </Box>
                );
              })}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}

export default NotificationBell;
