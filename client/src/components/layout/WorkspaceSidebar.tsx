"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/store/hooks";
import { useCurrentRole } from "@/hooks/useCurrentRole";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export interface WorkspaceSidebarProps {
  tenantSlug: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function WorkspaceSidebar({
  tenantSlug,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const t = useAppSelector((state) => state.language.t);
  const { roleDisplayName, isCenterAdmin, isTeacher, isStudent, user } = useCurrentRole();

  const classesLabel = isTeacher
    ? t.roles.instructor === "Teacher"
      ? "My Classes"
      : "Lớp phụ trách"
    : isStudent
    ? t.roles.student === "Student"
      ? "My Classes"
      : "Lớp học của tôi"
    : t.navigation.classes;

  const scheduleLabel = isTeacher
    ? t.roles.instructor === "Teacher"
      ? "Teaching Schedule"
      : "Lịch giảng dạy"
    : isStudent
    ? t.roles.student === "Student"
      ? "My Schedule"
      : "Lịch học của tôi"
    : t.navigation.schedule;

  const menuItems = [
    {
      id: "dashboard",
      href: ROUTES.TENANT.DASHBOARD(tenantSlug),
      label: t.navigation.dashboard,
      icon: <DashboardRoundedIcon fontSize="small" />,
      allowed: true,
    },
    {
      id: "courses",
      href: ROUTES.TENANT.COURSES(tenantSlug),
      label: t.navigation.courses,
      icon: <MenuBookRoundedIcon fontSize="small" />,
      allowed: true,
    },
    {
      id: "classes",
      href: ROUTES.TENANT.CLASSES(tenantSlug),
      label: classesLabel,
      icon: <GroupsRoundedIcon fontSize="small" />,
      allowed: true,
    },
    {
      id: "schedule",
      href: ROUTES.TENANT.SCHEDULE(tenantSlug),
      label: scheduleLabel,
      icon: <CalendarMonthRoundedIcon fontSize="small" />,
      allowed: true,
    },
    {
      id: "attendance",
      href: ROUTES.TENANT.ATTENDANCE(tenantSlug),
      label: t.navigation.attendance,
      icon: <FactCheckRoundedIcon fontSize="small" />,
      allowed: isCenterAdmin || isTeacher,
    },
  ].filter((item) => item.allowed);

  const checkIsActive = (href: string) => {
    if (href === ROUTES.TENANT.DASHBOARD(tenantSlug)) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const drawerWidth = isCollapsed ? 76 : 240;

  const sidebarContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        bgcolor: "background.paper",
      }}
    >
      <Box>
        {/* Brand Header */}
        <Box
          sx={{
            height: 64,
            px: 2,
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            component={Link}
            href={ROUTES.TENANT.DASHBOARD(tenantSlug)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              color: "inherit",
              overflow: "hidden",
              width: "100%",
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              }}
            >
              <SchoolRoundedIcon sx={{ fontSize: 20 }} />
            </Box>

            {!isCollapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: "text.primary",
                  }}
                >
                  {t.common.appName}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.7rem",
                    display: "block",
                  }}
                >
                  {tenantSlug}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Navigation Items */}
        <List sx={{ px: 1, py: 2 }}>
          {menuItems.map((item) => {
            const active = checkIsActive(item.href);
            const button = (
              <ListItemButton
                component={Link}
                href={item.href}
                onClick={onCloseMobile}
                selected={active}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  px: isCollapsed ? 1.5 : 2,
                  py: 1,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  transition: "all 0.15s ease",
                  "&.Mui-selected": {
                    bgcolor: "rgba(79, 70, 229, 0.08)",
                    color: "primary.main",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: "rgba(79, 70, 229, 0.12)",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "primary.main",
                    },
                  },
                  "&:hover": {
                    bgcolor: "grey.100",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsed ? 0 : 36,
                    color: active ? "primary.main" : "text.secondary",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: active ? 600 : 500,
                          color: active ? "primary.main" : "text.primary",
                        }}
                      >
                        {item.label}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.id} disablePadding sx={{ display: "block" }}>
                {isCollapsed ? (
                  <Tooltip title={item.label} placement="right">
                    {button}
                  </Tooltip>
                ) : (
                  button
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Role Card & Profile */}
      <Box sx={{ p: isCollapsed ? 1 : 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
        {isCollapsed ? (
          <Tooltip title={`${user?.email || "Người dùng"} (${roleDisplayName})`} placement="right">
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: isCenterAdmin
                    ? "primary.main"
                    : isTeacher
                    ? "warning.main"
                    : "success.main",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {isCenterAdmin ? "AD" : isTeacher ? "GV" : "HV"}
              </Avatar>
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: isCenterAdmin
                  ? "primary.main"
                  : isTeacher
                  ? "warning.main"
                  : "success.main",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              {isCenterAdmin ? "AD" : isTeacher ? "GV" : "HV"}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  display: "block",
                  fontWeight: 600,
                  color: "text.primary",
                  lineHeight: 1.2,
                }}
              >
                {user?.fullName || user?.email || "Người dùng"}
              </Typography>
              <Chip
                label={roleDisplayName}
                size="small"
                color={isCenterAdmin ? "primary" : isTeacher ? "warning" : "success"}
                variant="filled"
                sx={{
                  height: 20,
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  mt: 0.5,
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Collapse Toggle at bottom (Desktop only) */}
      <Box sx={{ p: 1, borderTop: "1px solid", borderColor: "divider" }}>
        <ListItemButton
          onClick={onToggleCollapse}
          sx={{
            display: { xs: "none", lg: "flex" },
            borderRadius: 2,
            justifyContent: isCollapsed ? "center" : "flex-start",
            color: "text.secondary",
            py: 1,
            px: isCollapsed ? 1.5 : 2,
            "&:hover": { bgcolor: "grey.100", color: "text.primary" },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: isCollapsed ? 0 : 36,
              color: "inherit",
              justifyContent: "center",
            }}
          >
            {isCollapsed ? (
              <ChevronRightRoundedIcon fontSize="small" />
            ) : (
              <ChevronLeftRoundedIcon fontSize="small" />
            )}
          </ListItemIcon>
          {!isCollapsed && (
            <ListItemText
              primary={
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                  }}
                >
                  {t.navigation.collapseSidebar}
                </Typography>
              }
            />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop Permanent Drawer */}
      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "block" },
          width: drawerWidth,
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          transition: "width 0.2s ease-in-out",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {sidebarContent}
      </Box>

      {/* Mobile Temporary Drawer */}
      <Drawer
        variant="temporary"
        open={isMobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 260,
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <Box sx={{ position: "relative", height: "100%" }}>
          <IconButton
            size="small"
            onClick={onCloseMobile}
            aria-label={t.navigation.closeMobileMenu}
            sx={{
              position: "absolute",
              top: 16,
              right: 12,
              zIndex: 1,
              color: "text.secondary",
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
          {sidebarContent}
        </Box>
      </Drawer>
    </>
  );
}

export default WorkspaceSidebar;
