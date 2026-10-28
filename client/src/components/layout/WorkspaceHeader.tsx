"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/store/hooks";
import { LanguageSwitcher } from "@/components/common";
import { authService } from "@/services/authService";
import { useCurrentRole } from "@/hooks/useCurrentRole";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";

export interface WorkspaceHeaderProps {
  tenantSlug: string;
  onToggleMobileMenu: () => void;
}

export function WorkspaceHeader({
  tenantSlug,
  onToggleMobileMenu,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const t = useAppSelector((state) => state.language.t);
  const { roleDisplayName, isCenterAdmin, isTeacher, user } = useCurrentRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Format tenant slug into clean display name (e.g. "apex-english" -> "Apex English")
  const formattedTenantTitle = tenantSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout to allow client redirection
    } finally {
      router.push(ROUTES.AUTH.LOGIN);
      router.refresh();
    }
  };

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left: Mobile Trigger & Workspace Badge */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label={t.navigation.toggleMobileMenu}
            onClick={onToggleMobileMenu}
            sx={{
              display: { lg: "none" },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 0.75,
            }}
          >
            <MenuRoundedIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: "primary.50",
                color: "primary.main",
                border: "1px solid",
                borderColor: "primary.100",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BusinessRoundedIcon sx={{ fontSize: 18 }} />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  display: { xs: "none", sm: "inline" },
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                {t.navigation.workspaceBadge}:
              </Typography>
              <Chip
                label={formattedTenantTitle}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  bgcolor: "grey.100",
                  border: "1px solid",
                  borderColor: "divider",
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Right: Role Badge, Language, Switch Workspace, Logout */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* User Role Badge */}
          <Tooltip title={`Vai trò: ${roleDisplayName}${user?.email ? ` • ${user.email}` : ""}`}>
            <Chip
              icon={<AccountCircleRoundedIcon sx={{ fontSize: "16px !important" }} />}
              label={roleDisplayName}
              size="small"
              color={isCenterAdmin ? "primary" : isTeacher ? "warning" : "success"}
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                bgcolor: isCenterAdmin
                  ? "rgba(79, 70, 229, 0.06)"
                  : isTeacher
                  ? "rgba(245, 158, 11, 0.08)"
                  : "rgba(16, 185, 129, 0.08)",
                borderColor: isCenterAdmin
                  ? "primary.200"
                  : isTeacher
                  ? "warning.300"
                  : "success.300",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          </Tooltip>

          <LanguageSwitcher />

          <Tooltip title={t.navigation.switchWorkspace}>
            <Button
              component={Link}
              href={ROUTES.AUTH.LOGIN}
              variant="outlined"
              size="small"
              startIcon={<SwapHorizRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  bgcolor: "grey.50",
                  borderColor: "grey.400",
                },
                display: { xs: "none", sm: "inline-flex" },
                py: 0.6,
                px: 1.5,
              }}
            >
              {t.navigation.switchWorkspace}
            </Button>
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={handleLogout}
            disabled={isLoggingOut}
            startIcon={
              isLoggingOut ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <LogoutRoundedIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              py: 0.6,
              px: 1.5,
              borderColor: "error.light",
              bgcolor: "rgba(239, 68, 68, 0.04)",
              "&:hover": {
                bgcolor: "rgba(239, 68, 68, 0.1)",
                borderColor: "error.main",
              },
            }}
          >
            {isLoggingOut ? t.navigation.loggingOut : t.navigation.logout}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default WorkspaceHeader;
