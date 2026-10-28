"use client";

import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import type { ClassResponse } from "@/types/class";
import { useClassEnrollments } from "@/hooks/useClassEnrollments";
import { useStudents } from "@/hooks/useStudents";
import { classService } from "@/services/classService";

interface EnrollmentDrawerProps {
  open: boolean;
  onClose: () => void;
  classItem: ClassResponse | null;
  tenantSlug: string;
  isCenterAdmin: boolean;
  onEnrollmentChanged?: () => void;
}

export function EnrollmentDrawer({
  open,
  onClose,
  classItem,
  tenantSlug,
  isCenterAdmin,
  onEnrollmentChanged,
}: EnrollmentDrawerProps) {
  const { enrollments, isLoading, isError, error, mutate } = useClassEnrollments(
    classItem?.id ?? null,
    tenantSlug
  );
  const { students, isLoading: isStudentsLoading } = useStudents(tenantSlug);

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!classItem) return null;

  const currentCount = enrollments.length;
  const isFull = currentCount >= classItem.maxCapacity;

  // Lọc các học viên chưa ghi danh vào lớp
  const availableStudents = students.filter(
    (s) => !enrollments.some((e) => e.studentId === s.userId)
  );

  const handleEnroll = async () => {
    if (!selectedStudentId) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await classService.enrollStudent(classItem.id, selectedStudentId);
      setSelectedStudentId("");
      await mutate();
      onEnrollmentChanged?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ghi danh học viên thất bại.";
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy ghi danh học viên này khỏi lớp học?")) return;
    setDeletingId(studentId);
    setActionError(null);
    try {
      await classService.removeEnrollment(classItem.id, studentId);
      await mutate();
      onEnrollmentChanged?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi hủy ghi danh.";
      setActionError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: { backdropFilter: "blur(4px)", bgcolor: "rgba(15, 23, 42, 0.4)" },
        },
        paper: {
          sx: {
            width: { xs: "100%", sm: 540 },
            p: 0,
            boxShadow: 24,
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Drawer Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Danh sách học viên
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lớp: {classItem.name} — Khóa: {classItem.courseTitle}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Đóng bảng ghi danh">
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2 }}>
          <Chip
            icon={<PeopleAltOutlinedIcon />}
            label={`Sĩ số: ${currentCount} / ${classItem.maxCapacity} học viên`}
            color={isFull ? "error" : "primary"}
            variant={isFull ? "filled" : "outlined"}
            sx={{ fontWeight: 600 }}
          />
          {isFull && (
            <Chip
              label="Lớp đã đầy"
              size="small"
              color="error"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>

      {/* Drawer Content */}
      <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}

        {/* Khu vực Ghi danh Học viên Mới (Dành cho CenterAdmin) */}
        {isCenterAdmin && (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2,
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "background.paper" : "grey.50"),
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Ghi danh học viên mới vào lớp
            </Typography>
            {isFull ? (
              <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                Lớp học đã đạt mức sĩ số tối đa ({classItem.maxCapacity} học viên). Vui lòng nâng hạn ngạch lớp học nếu muốn tiếp nhận thêm.
              </Alert>
            ) : (
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="select-student-label">Chọn học viên</InputLabel>
                  <Select
                    labelId="select-student-label"
                    value={selectedStudentId}
                    label="Chọn học viên"
                    disabled={submitting || isStudentsLoading}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    {availableStudents.length === 0 ? (
                      <MenuItem disabled value="">
                        {isStudentsLoading
                          ? "Đang tải danh sách..."
                          : "Không có học viên khả dụng"}
                      </MenuItem>
                    ) : (
                      availableStudents.map((s) => (
                        <MenuItem key={s.userId} value={s.userId}>
                          {s.fullName} ({s.email})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedStudentId || submitting}
                  onClick={handleEnroll}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PersonAddAlt1RoundedIcon fontSize="small" />
                    )
                  }
                  sx={{ minWidth: 120, whiteSpace: "nowrap" }}
                >
                  Ghi danh
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {/* Danh sách học viên đã ghi danh */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Học viên trong lớp ({enrollments.length})
        </Typography>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : isError ? (
          <Alert severity="error">
            {error?.message || "Không thể tải danh sách học viên."}
          </Alert>
        ) : enrollments.length === 0 ? (
          <Box
            sx={{
              py: 5,
              textAlign: "center",
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "background.default" : "grey.50"),
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Chưa có học viên nào được ghi danh vào lớp học này.
            </Typography>
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Họ và tên</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày ghi danh</TableCell>
                    {isCenterAdmin && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Thao tác
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrollments.map((enr) => (
                    <TableRow key={enr.enrollmentId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{enr.studentName}</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
                        {enr.studentEmail}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8125rem" }}>
                        {new Date(enr.enrolledAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      {isCenterAdmin && (
                        <TableCell align="right">
                          <Tooltip title="Hủy ghi danh học viên">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={deletingId === enr.studentId}
                                onClick={() => handleRemove(enr.studentId)}
                                aria-label="Xóa học viên khỏi lớp"
                              >
                                {deletingId === enr.studentId ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {/* Drawer Footer */}
      <Divider />
      <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Đóng
        </Button>
      </Box>
    </Drawer>
  );
}

export default EnrollmentDrawer;
