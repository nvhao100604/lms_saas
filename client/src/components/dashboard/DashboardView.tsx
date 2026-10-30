"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import RoomRoundedIcon from "@mui/icons-material/RoomRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/store/hooks";
import { useCurrentRole } from "@/hooks/useCurrentRole";
import { useDashboard } from "@/hooks/useDashboard";
import { dashboardService } from "@/services/dashboardService";
import type { SubscriptionPlanItemResponse } from "@/types/dashboard";

export interface DashboardViewProps {
  tenantSlug: string;
  hasToken: boolean;
}

export function DashboardView({ tenantSlug }: DashboardViewProps) {
  const t = useAppSelector((state) => state.language.t);
  const { isCenterAdmin, isTeacher } = useCurrentRole();
  const { dashboard, isLoading, isError, error, isValidating, mutate } =
    useDashboard(tenantSlug);

  // Subscription Plan Dialog & Mutate state
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlanItemResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleOpenPlanDialog = async () => {
    setOpenPlanDialog(true);
    setPlanError(null);
    setLoadingPlans(true);
    try {
      const data = await dashboardService.getSubscriptionPlans();
      setPlans(data);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : t.courses.defaultErrorMessage;
      setPlanError(errorMsg);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleClosePlanDialog = () => {
    if (!changingPlanId) {
      setOpenPlanDialog(false);
      setPlanError(null);
    }
  };

  const handleChangePlan = async (planId: string) => {
    setChangingPlanId(planId);
    setPlanError(null);
    try {
      await dashboardService.changeSubscriptionPlan({ planId });
      setSnackbar({
        open: true,
        message: t.dashboard.changePlanSuccess,
        severity: "success",
      });
      setOpenPlanDialog(false);
      await mutate();
    } catch (err: unknown) {
      interface AxiosErrorResponse {
        response?: { data?: { message?: string } };
        message?: string;
      }
      const axiosErr = err as AxiosErrorResponse;
      const errorMsg =
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        t.dashboard.changePlanFailed;
      setPlanError(errorMsg);
    } finally {
      setChangingPlanId(null);
    }
  };

  // Format tenant display name from slug (e.g. "trung-tam-anh-ngu" -> "Trung Tam Anh Ngu")
  const formattedTenantTitle = tenantSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Quota percentage calculations
  const classUsagePercent = dashboard?.quota.maxClassesLimit
    ? Math.min(
        Math.round(
          (dashboard.quota.currentClassesCount /
            dashboard.quota.maxClassesLimit) *
            100
        ),
        100
      )
    : 0;

  const studentUsagePercent = dashboard?.quota.maxStudentsLimit
    ? Math.min(
        Math.round(
          (dashboard.quota.currentStudentsCount /
            dashboard.quota.maxStudentsLimit) *
            100
        ),
        100
      )
    : 0;

  const getQuotaColor = (percent: number): "primary" | "warning" | "error" => {
    if (percent > 85) return "error";
    if (percent > 70) return "warning";
    return "primary";
  };

  // Format session time
  const formatTimeSlot = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startStr = start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const endStr = end.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${startStr} - ${endStr}`;
  };

  const isTodaySession = (startTime: string) => {
    const sessionDate = new Date(startTime).toDateString();
    const today = new Date().toDateString();
    return sessionDate === today;
  };

  const hasAnyTodaySessions =
    dashboard?.todaySessions && dashboard.todaySessions.length > 0
      ? isTodaySession(dashboard.todaySessions[0].startTime)
      : false;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, display: "flex", flexDirection: "column", gap: 3.5, maxWidth: 1400, mx: "auto" }}>
      {/* 1. Hero Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          p: { xs: 3, sm: 4 },
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)",
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(30, 27, 75, 0.25)",
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 750 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(10px)",
              px: 1.5,
              py: 0.5,
              borderRadius: 99,
              mb: 2,
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <WorkspacePremiumRoundedIcon sx={{ fontSize: 16, color: "#a5b4fc" }} />
            <Typography variant="caption" sx={{ color: "#e0e7ff", fontWeight: 600 }}>
              {t.dashboard.currentSpaceBadge}
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em", mb: 1.5 }}>
            {t.dashboard.welcomePrefix}{" "}
            <Box component="span" sx={{ color: "#a5b4fc" }}>
              {formattedTenantTitle}
            </Box>
          </Typography>

          <Typography variant="body1" sx={{ color: "rgba(224, 231, 255, 0.9)", lineHeight: 1.6, mb: 3 }}>
            {t.dashboard.workingInSpace}{" "}
            <Box
              component="span"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.15)",
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              {formattedTenantTitle}
            </Box>
            . {t.dashboard.bffSecurityDesc}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {isCenterAdmin ? (
              <>
                <Button
                  component={Link}
                  href={ROUTES.TENANT.COURSES(tenantSlug)}
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "#1e1b4b",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2,
                    px: 2.5,
                    "&:hover": { bgcolor: "#f5f3ff" },
                  }}
                >
                  {t.dashboard.createNewCourse}
                </Button>
                <Button
                  component={Link}
                  href={ROUTES.TENANT.CLASSES(tenantSlug)}
                  variant="outlined"
                  startIcon={<GroupsRoundedIcon />}
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "#ffffff",
                    fontWeight: 600,
                    textTransform: "none",
                    borderRadius: 2,
                    px: 2.5,
                    backdropFilter: "blur(4px)",
                    "&:hover": {
                      borderColor: "#ffffff",
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  {t.dashboard.quickManageClasses}
                </Button>
              </>
            ) : (
              <Button
                component={Link}
                href={ROUTES.TENANT.SCHEDULE(tenantSlug)}
                variant="contained"
                startIcon={<CalendarMonthRoundedIcon />}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#1e1b4b",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2.5,
                  "&:hover": { bgcolor: "#f5f3ff" },
                }}
              >
                {t.dashboard.viewScheduleAction}
              </Button>
            )}

            <Tooltip title={t.courses.refreshSwr}>
              <span>
                <IconButton
                  onClick={() => mutate()}
                  disabled={isValidating}
                  sx={{
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                  }}
                >
                  <RefreshRoundedIcon
                    fontSize="small"
                    sx={{
                      animation: isValidating ? "spin 1s linear infinite" : "none",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Error state */}
      {isError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error?.message || t.courses.defaultErrorMessage}
        </Alert>
      )}

      {/* 2. 4 Top KPI Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: 2.5,
        }}
      >
        {/* KPI 1: Active Courses */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              {t.dashboard.kpiActiveCourses}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}>
              {isLoading ? <Skeleton width={40} /> : dashboard?.totalActiveCourses ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {t.dashboard.kpiActiveCoursesSub}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              bgcolor: "primary.50",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MenuBookRoundedIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* KPI 2: Ongoing Classes */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              {t.dashboard.kpiOngoingClasses}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "info.main" }}>
              {isLoading ? <Skeleton width={40} /> : dashboard?.totalOngoingClasses ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {t.dashboard.kpiOngoingClassesSub}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              bgcolor: "info.50",
              color: "info.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GroupsRoundedIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* KPI 3: Members Community */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              {t.dashboard.kpiTotalMembers}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
              {isLoading ? (
                <Skeleton width={40} />
              ) : (
                (dashboard?.totalActiveStudents ?? 0) +
                (dashboard?.totalActiveTeachers ?? 0)
              )}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {isLoading ? (
                <Skeleton width={90} />
              ) : (
                `${dashboard?.totalActiveStudents ?? 0} học viên, ${dashboard?.totalActiveTeachers ?? 0} giảng viên`
              )}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              bgcolor: "success.50",
              color: "success.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SchoolRoundedIcon fontSize="medium" />
          </Box>
        </Paper>

        {/* KPI 4: Attendance Rate */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              {t.dashboard.kpiAttendanceRate}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 0.5,
                color:
                  (dashboard?.attendanceRatePercent ?? 100) >= 80
                    ? "success.main"
                    : (dashboard?.attendanceRatePercent ?? 100) >= 60
                    ? "warning.main"
                    : "error.main",
              }}
            >
              {isLoading ? (
                <Skeleton width={50} />
              ) : (
                `${dashboard?.attendanceRatePercent ?? 100}%`
              )}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {t.dashboard.kpiAttendanceRateSub}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              bgcolor: "secondary.50",
              color: "secondary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FactCheckRoundedIcon fontSize="medium" />
          </Box>
        </Paper>
      </Box>

      {/* 3. Subscription Quota Card (Visible to CenterAdmin) */}
      {isCenterAdmin && (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t.dashboard.quotaCardTitle}
                </Typography>
                {isLoading ? (
                  <Skeleton width={60} height={24} />
                ) : (
                  <Chip
                    size="small"
                    label={dashboard?.quota.planName}
                    color="primary"
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {t.dashboard.quotaCardDesc}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              {!isLoading && (
                <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {dashboard?.quota.monthlyPrice.toLocaleString("vi-VN")}{" "}
                  {t.dashboard.currencyVndSuffix}
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<WorkspacePremiumRoundedIcon />}
                onClick={handleOpenPlanDialog}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  borderColor: "primary.main",
                  "&:hover": { bgcolor: "primary.50" },
                }}
              >
                {t.dashboard.upgradePlanBtn}
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
            {/* Class Quota Progress */}
            <Box sx={{ bgcolor: "action.hover", p: 2, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t.dashboard.quotaClassesLabel}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {isLoading ? (
                    <Skeleton width={50} />
                  ) : (
                    `${dashboard?.quota.currentClassesCount} / ${dashboard?.quota.maxClassesLimit} (${classUsagePercent}%)`
                  )}
                </Typography>
              </Box>
              <LinearProgress
                variant={isLoading ? "indeterminate" : "determinate"}
                value={classUsagePercent}
                color={getQuotaColor(classUsagePercent)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Student Quota Progress */}
            <Box sx={{ bgcolor: "action.hover", p: 2, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t.dashboard.quotaStudentsLabel}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {isLoading ? (
                    <Skeleton width={50} />
                  ) : (
                    `${dashboard?.quota.currentStudentsCount} / ${dashboard?.quota.maxStudentsLimit} (${studentUsagePercent}%)`
                  )}
                </Typography>
              </Box>
              <LinearProgress
                variant={isLoading ? "indeterminate" : "determinate"}
                value={studentUsagePercent}
                color={getQuotaColor(studentUsagePercent)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>

          {/* Quota warning alert if nearing limit */}
          {!isLoading && (classUsagePercent > 85 || studentUsagePercent > 85) && (
            <Alert
              severity="warning"
              icon={<WarningAmberRoundedIcon />}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {t.dashboard.quotaCriticalLevel} ({classUsagePercent > 85 ? t.dashboard.quotaClassesLabel : t.dashboard.quotaStudentsLabel}). {t.dashboard.quotaUpgradeAction}.
            </Alert>
          )}
        </Paper>
      )}

      {/* 4. Today & Upcoming Sessions Card */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonthRoundedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t.dashboard.todaySessionsTitle}
            </Typography>
            {dashboard?.todaySessions && dashboard.todaySessions.length > 0 && (
              <Chip
                size="small"
                label={
                  hasAnyTodaySessions
                    ? t.dashboard.todaySessionsBadge
                    : t.dashboard.upcomingSessionsBadge
                }
                color={hasAnyTodaySessions ? "success" : "info"}
                sx={{ fontWeight: 600, borderRadius: 1.5 }}
              />
            )}
          </Box>

          <Button
            component={Link}
            href={ROUTES.TENANT.SCHEDULE(tenantSlug)}
            endIcon={<ArrowForwardRoundedIcon />}
            size="small"
            sx={{ fontWeight: 600, textTransform: "none" }}
          >
            {t.dashboard.viewScheduleAction}
          </Button>
        </Box>

        {/* Sessions list */}
        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={68} />
            ))}
          </Box>
        ) : !dashboard?.todaySessions || dashboard.todaySessions.length === 0 ? (
          <Box
            sx={{
              py: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 1,
            }}
          >
            <CalendarMonthRoundedIcon sx={{ fontSize: 44, color: "text.disabled" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t.dashboard.noSessionsFound}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 450 }}>
              {t.dashboard.noSessionsDesc}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {dashboard.todaySessions.map((session) => (
              <Paper
                key={session.sessionId}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: { xs: "flex-start", md: "center" },
                  justifyContent: "space-between",
                  gap: 1.5,
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: "action.hover",
                    borderColor: "primary.main",
                  },
                }}
              >
                {/* Time & Session Number */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 200 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: "primary.50",
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AccessTimeRoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {formatTimeSlot(session.startTime, session.endTime)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t.dashboard.sessionNumberPrefix} {session.sessionNumber}
                    </Typography>
                  </Box>
                </Box>

                {/* Class & Course */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                    {session.className}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {session.courseTitle}
                    {session.topic ? ` • ${t.dashboard.topicPrefix}: ${session.topic}` : ""}
                  </Typography>
                </Box>

                {/* Room & Teacher */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 220 }}>
                  {session.roomName && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <RoomRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                        {session.roomName}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <SchoolRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                      {session.teacherName}
                    </Typography>
                  </Box>
                </Box>

                {/* Action Button */}
                <Box>
                  {isCenterAdmin || isTeacher ? (
                    <Button
                      component={Link}
                      href={ROUTES.TENANT.ATTENDANCE(tenantSlug)}
                      variant="outlined"
                      size="small"
                      startIcon={<FactCheckRoundedIcon />}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 1.5,
                        fontSize: "0.8rem",
                      }}
                    >
                      {t.dashboard.takeAttendanceAction}
                    </Button>
                  ) : (
                    <Button
                      component={Link}
                      href={ROUTES.TENANT.SCHEDULE(tenantSlug)}
                      variant="outlined"
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 1.5,
                        fontSize: "0.8rem",
                      }}
                    >
                      {t.dashboard.viewScheduleAction}
                    </Button>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* 5. Quick Actions Toolbar */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5 }}>
          {t.dashboard.quickActionsTitle}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "repeat(4, 1fr)",
            },
            gap: 1.5,
          }}
        >
          <Button
            component={Link}
            href={ROUTES.TENANT.COURSES(tenantSlug)}
            variant="outlined"
            startIcon={<MenuBookRoundedIcon />}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              p: 1.5,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
            }}
          >
            {t.navigation.courses}
          </Button>

          <Button
            component={Link}
            href={ROUTES.TENANT.CLASSES(tenantSlug)}
            variant="outlined"
            startIcon={<GroupsRoundedIcon />}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              p: 1.5,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
            }}
          >
            {t.dashboard.quickManageClasses}
          </Button>

          <Button
            component={Link}
            href={ROUTES.TENANT.MEMBERS(tenantSlug)}
            variant="outlined"
            startIcon={<PeopleAltRoundedIcon />}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              p: 1.5,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
            }}
          >
            {t.dashboard.quickManageMembers}
          </Button>

          <Button
            component={Link}
            href={ROUTES.TENANT.SCHEDULE(tenantSlug)}
            variant="outlined"
            startIcon={<CalendarMonthRoundedIcon />}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              p: 1.5,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
            }}
          >
            {t.dashboard.quickViewSchedule}
          </Button>
        </Box>
      </Box>

      {/* 6. Upgrade / Change Subscription Plan Dialog */}
      <Dialog
        open={openPlanDialog}
        onClose={handleClosePlanDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t.dashboard.planDialogTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {t.dashboard.planDialogDesc}
            </Typography>
          </Box>
          <IconButton onClick={handleClosePlanDialog} disabled={!!changingPlanId}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {planError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {planError}
            </Alert>
          )}

          {loadingPlans ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2.5,
              }}
            >
              {plans.map((p) => (
                <Paper
                  key={p.id}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderColor: p.isCurrentPlan ? "primary.main" : "divider",
                    borderWidth: p.isCurrentPlan ? 2 : 1,
                    bgcolor: p.isCurrentPlan ? "primary.50" : "background.paper",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      boxShadow: (theme) => theme.shadows[4],
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                        {p.name}
                      </Typography>
                      {p.isCurrentPlan && (
                        <Chip
                          size="small"
                          label={t.dashboard.currentPlanBadge}
                          color="success"
                          sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        />
                      )}
                    </Box>

                    <Box sx={{ my: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
                        {p.monthlyPrice.toLocaleString("vi-VN")}{" "}
                        <Typography component="span" variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                          đ / {t.dashboard.planPerMonth}
                        </Typography>
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, my: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleRoundedIcon fontSize="small" color="primary" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.maxClassesLimit} {t.dashboard.planMaxClasses}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleRoundedIcon fontSize="small" color="primary" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.maxStudentsLimit} {t.dashboard.planMaxStudents}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant={p.isCurrentPlan ? "outlined" : "contained"}
                    disabled={p.isCurrentPlan || !!changingPlanId}
                    onClick={() => handleChangePlan(p.id)}
                    sx={{ mt: 2, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                  >
                    {changingPlanId === p.id
                      ? t.dashboard.selectingPlanBtn
                      : p.isCurrentPlan
                      ? t.dashboard.currentPlanBadge
                      : t.dashboard.selectPlanBtn}
                  </Button>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Snackbar Toast Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DashboardView;
