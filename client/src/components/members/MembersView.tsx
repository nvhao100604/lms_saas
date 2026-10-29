"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tooltip,
  Avatar,
  CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useMembers } from "@/hooks/useMembers";
import { useCurrentRole } from "@/hooks/useCurrentRole";
import { useAppSelector } from "@/store/hooks";
import { AppApiError } from "@/lib/axios";
import type {
  TenantMemberResponse,
  RoleInTenant,
  CreateTenantMemberRequest,
} from "@/types/member";

export interface MembersViewProps {
  tenantSlug: string;
}

export function MembersView({ tenantSlug }: MembersViewProps) {
  const t = useAppSelector((state) => state.language.t);
  const { isCenterAdmin, user } = useCurrentRole();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Members Hook
  const {
    members,
    isLoading,
    isError,
    error,
    isValidating,
    mutate,
    createMember,
    patchMember,
  } = useMembers(tenantSlug, {
    role: filterRole !== "all" ? filterRole : undefined,
    search: search.trim() ? search.trim() : undefined,
  });

  // Dialog State: Add Member
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<RoleInTenant>("Student");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Updating States
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Client-side status filtering if needed
  const displayedMembers = useMemo(() => {
    if (filterStatus === "active") {
      return members.filter((m) => m.isActive);
    }
    if (filterStatus === "inactive") {
      return members.filter((m) => !m.isActive);
    }
    return members;
  }, [members, filterStatus]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = members.length;
    const admins = members.filter((m) => m.role === "CenterAdmin").length;
    const teachers = members.filter((m) => m.role === "Teacher").length;
    const students = members.filter((m) => m.role === "Student").length;
    return { total, admins, teachers, students };
  }, [members]);

  // Check if a member row belongs to the currently logged in user
  const checkIsSelf = (member: TenantMemberResponse) => {
    if (user?.userId && member.userId === user.userId) {
      return true;
    }
    if (
      user?.email &&
      member.email.toLowerCase() === user.email.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // Quick Role Change Handler
  const handleRoleChange = async (
    member: TenantMemberResponse,
    newRole: RoleInTenant
  ) => {
    if (member.role === newRole) return;

    if (checkIsSelf(member) && newRole !== "CenterAdmin") {
      setSnackbar({
        open: true,
        message: t.members.selfLockoutWarning,
        severity: "warning",
      });
      return;
    }

    try {
      setUpdatingMemberId(member.memberId);
      await patchMember(member.memberId, { role: newRole });
      setSnackbar({
        open: true,
        message: t.members.quickRoleChangeSuccess,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof AppApiError
            ? err.message
            : "Không thể cập nhật vai trò thành viên.",
        severity: "error",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Quick Status Toggle Handler
  const handleStatusToggle = async (
    member: TenantMemberResponse,
    nextActive: boolean
  ) => {
    if (checkIsSelf(member) && !nextActive) {
      setSnackbar({
        open: true,
        message: t.members.selfLockoutWarning,
        severity: "warning",
      });
      return;
    }

    try {
      setUpdatingMemberId(member.memberId);
      await patchMember(member.memberId, { isActive: nextActive });
      setSnackbar({
        open: true,
        message: t.members.quickStatusChangeSuccess,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof AppApiError
            ? err.message
            : "Không thể cập nhật trạng thái hoạt động.",
        severity: "error",
      });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Add Member Submit
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formEmail.trim()) {
      setFormError("Vui lòng nhập đầy đủ họ tên và email hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload: CreateTenantMemberRequest = {
        fullName: formFullName.trim(),
        email: formEmail.trim(),
        role: formRole,
        initialPassword: formPassword.trim() ? formPassword.trim() : undefined,
      };

      await createMember(payload);

      setSnackbar({
        open: true,
        message: t.members.addSuccess,
        severity: "success",
      });

      // Reset Form and Close
      setIsAddOpen(false);
      setFormFullName("");
      setFormEmail("");
      setFormRole("Student");
      setFormPassword("");
      setShowPassword(false);
    } catch (err) {
      if (err instanceof AppApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Không thể thêm thành viên. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role display label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "CenterAdmin":
        return t.members.filterRoleAdmin;
      case "Teacher":
        return t.members.filterRoleTeacher;
      case "Student":
        return t.members.filterRoleStudent;
      default:
        return role;
    }
  };

  // Role Chip Color
  const getRoleChipColor = (
    role: string
  ): "primary" | "secondary" | "success" | "info" | "default" => {
    switch (role) {
      case "CenterAdmin":
        return "secondary";
      case "Teacher":
        return "success";
      case "Student":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Read-only Notice for Non-CenterAdmin */}
      {!isCenterAdmin && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon fontSize="small" />}
          sx={{ borderRadius: 2 }}
        >
          {t.members.readOnlyNotice}
        </Alert>
      )}

      {/* KPI Cards (4 Cards) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {/* Total Members */}
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
              {t.members.kpiTotalMembers}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "text.primary" }}>
              {isLoading ? <Skeleton width={40} /> : stats.total}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {t.members.kpiTotalMembersSub}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "primary.50",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PeopleAltRoundedIcon />
          </Box>
        </Paper>

        {/* Administrators */}
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
              {t.members.kpiAdmins}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "secondary.main" }}>
              {isLoading ? <Skeleton width={40} /> : stats.admins}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {t.members.kpiAdminsSub}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "secondary.50",
              color: "secondary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AdminPanelSettingsRoundedIcon />
          </Box>
        </Paper>

        {/* Teachers */}
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
              {t.members.kpiTeachers}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "success.main" }}>
              {isLoading ? <Skeleton width={40} /> : stats.teachers}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {t.members.kpiTeachersSub}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "success.50",
              color: "success.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SchoolRoundedIcon />
          </Box>
        </Paper>

        {/* Students */}
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
              {t.members.kpiStudents}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "info.main" }}>
              {isLoading ? <Skeleton width={40} /> : stats.students}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {t.members.kpiStudentsSub}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "info.50",
              color: "info.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PersonOutlineRoundedIcon />
          </Box>
        </Paper>
      </Box>

      {/* Filter & Action Toolbar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            flex: 1,
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          {/* Search Box */}
          <TextField
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.members.searchPlaceholder}
            sx={{ minWidth: { xs: "100%", sm: 280 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch("")}>
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          {/* Role Filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t.members.roleLabel}</InputLabel>
            <Select
              value={filterRole}
              label={t.members.roleLabel}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <MenuItem value="all">{t.members.filterRoleAll}</MenuItem>
              <MenuItem value="CenterAdmin">{t.members.filterRoleAdmin}</MenuItem>
              <MenuItem value="Teacher">{t.members.filterRoleTeacher}</MenuItem>
              <MenuItem value="Student">{t.members.filterRoleStudent}</MenuItem>
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t.members.colStatus}</InputLabel>
            <Select
              value={filterStatus}
              label={t.members.colStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">{t.members.filterStatusAll}</MenuItem>
              <MenuItem value="active">{t.members.filterStatusActive}</MenuItem>
              <MenuItem value="inactive">{t.members.filterStatusInactive}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title={t.courses.refreshSwr}>
            <span>
              <IconButton
                onClick={() => mutate()}
                disabled={isValidating}
                size="medium"
                sx={{ border: "1px solid", borderColor: "divider" }}
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

          {isCenterAdmin && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => {
                setFormError(null);
                setIsAddOpen(true);
              }}
              sx={{
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
              }}
            >
              {t.members.addMemberBtn}
            </Button>
          )}
        </Box>
      </Box>

      {/* Error state */}
      {isError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error?.message || t.courses.defaultErrorMessage}
        </Alert>
      )}

      {/* Members Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>{t.members.colMember}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t.members.colEmail}</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 170 }}>{t.members.colRole}</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>{t.members.colStatus}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t.members.colJoinedAt}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Skeleton variant="circular" width={36} height={36} />
                        <Box sx={{ width: "100%" }}>
                          <Skeleton width="60%" />
                          <Skeleton width="40%" height={14} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Skeleton width={180} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={110} /></TableCell>
                  </TableRow>
                ))
              ) : displayedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, textAlign: "center" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <PeopleAltRoundedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary" }}>
                        {t.members.emptyTitle}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {t.members.emptyDesc}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayedMembers.map((member) => {
                  const isSelf = checkIsSelf(member);
                  const isRowUpdating = updatingMemberId === member.memberId;

                  return (
                    <TableRow
                      key={member.memberId}
                      hover
                      sx={{
                        bgcolor: isSelf ? "action.selected" : "inherit",
                        transition: "background-color 0.2s",
                      }}
                    >
                      {/* Member Info */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor:
                                member.role === "CenterAdmin"
                                  ? "secondary.main"
                                  : member.role === "Teacher"
                                  ? "success.main"
                                  : "primary.main",
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            {member.fullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                                {member.fullName}
                              </Typography>
                              {isSelf && (
                                <Chip
                                  size="small"
                                  label="Bạn"
                                  color="primary"
                                  variant="filled"
                                  sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700 }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {member.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <EmailOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {member.email}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Role Column */}
                      <TableCell>
                        {isCenterAdmin && !isSelf ? (
                          <FormControl size="small" sx={{ minWidth: 140 }}>
                            <Select
                              value={member.role}
                              disabled={isRowUpdating}
                              onChange={(e) =>
                                handleRoleChange(member, e.target.value as RoleInTenant)
                              }
                              sx={{
                                fontSize: "0.825rem",
                                borderRadius: 1.5,
                              }}
                            >
                              <MenuItem value="Student">{t.members.filterRoleStudent}</MenuItem>
                              <MenuItem value="Teacher">{t.members.filterRoleTeacher}</MenuItem>
                              <MenuItem value="CenterAdmin">{t.members.filterRoleAdmin}</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={getRoleLabel(member.role)}
                            color={getRoleChipColor(member.role)}
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </TableCell>

                      {/* Status Column */}
                      <TableCell>
                        {isCenterAdmin ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Tooltip
                              title={
                                isSelf
                                  ? t.members.selfLockoutWarning
                                  : member.isActive
                                  ? "Gạt để tạm ngưng hoạt động"
                                  : "Gạt để kích hoạt lại"
                              }
                            >
                              <span>
                                <Switch
                                  size="small"
                                  checked={member.isActive}
                                  disabled={isSelf || isRowUpdating}
                                  onChange={(e) =>
                                    handleStatusToggle(member, e.target.checked)
                                  }
                                  color="success"
                                />
                              </span>
                            </Tooltip>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={
                                member.isActive
                                  ? t.members.statusActive
                                  : t.members.statusInactive
                              }
                              color={member.isActive ? "success" : "default"}
                              sx={{
                                fontWeight: 500,
                                fontSize: "0.725rem",
                                height: 22,
                              }}
                            />
                          </Box>
                        ) : (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              member.isActive
                                ? t.members.statusActive
                                : t.members.statusInactive
                            }
                            color={member.isActive ? "success" : "default"}
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <CalendarTodayRoundedIcon
                            fontSize="small"
                            sx={{ color: "text.secondary", fontSize: 16 }}
                          />
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {new Date(member.joinedAt).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog: Add New Member */}
      <Dialog
        open={isAddOpen}
        onClose={isSubmitting ? undefined : () => setIsAddOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t.members.dialogTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t.members.dialogSubtitle}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setIsAddOpen(false)}
            disabled={isSubmitting}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleAddMember}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
            {formError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {formError}
              </Alert>
            )}

            {/* Full Name */}
            <TextField
              required
              fullWidth
              label={t.members.fullNameLabel}
              placeholder={t.members.fullNamePlaceholder}
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              disabled={isSubmitting}
            />

            {/* Email */}
            <TextField
              required
              fullWidth
              type="email"
              label={t.members.emailLabel}
              placeholder={t.members.emailPlaceholder}
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              disabled={isSubmitting}
            />

            {/* Role Selection */}
            <FormControl fullWidth required>
              <InputLabel>{t.members.roleLabel}</InputLabel>
              <Select
                value={formRole}
                label={t.members.roleLabel}
                onChange={(e) => setFormRole(e.target.value as RoleInTenant)}
                disabled={isSubmitting}
              >
                <MenuItem value="Student">{t.members.filterRoleStudent} (Student)</MenuItem>
                <MenuItem value="Teacher">{t.members.filterRoleTeacher} (Teacher)</MenuItem>
                <MenuItem value="CenterAdmin">{t.members.filterRoleAdmin} (CenterAdmin)</MenuItem>
              </Select>
            </FormControl>

            {/* Initial Password */}
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label={t.members.initialPasswordLabel}
              placeholder={t.members.initialPasswordPlaceholder}
              helperText={t.members.initialPasswordHelper}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              disabled={isSubmitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon fontSize="small" />
                        ) : (
                          <VisibilityRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {t.members.cancelBtn}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />}
              sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
            >
              {isSubmitting ? t.members.submittingBtn : t.members.submitBtn}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Toast Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MembersView;

