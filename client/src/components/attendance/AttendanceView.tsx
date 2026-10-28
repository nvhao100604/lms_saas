"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeFilledRoundedIcon from "@mui/icons-material/AccessTimeFilledRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useClasses, useClassDetail } from "@/hooks/useClasses";
import { useSessionAttendance } from "@/hooks/useSessionAttendance";
import { attendanceService } from "@/services/attendanceService";
import type {
  AttendanceStatusType,
  AttendanceItemPayload,
  SessionAttendanceSheet,
} from "@/types/attendance";

interface AttendanceViewProps {
  tenantSlug: string;
}

// Map trạng thái string sang enum số cho Backend: 1: Present, 2: Absent, 3: Late, 4: Excused
const STATUS_TO_INT: Record<AttendanceStatusType, number> = {
  Present: 1,
  Absent: 2,
  Late: 3,
  Excused: 4,
};

interface AttendanceSheetDetailProps {
  sessionId: string;
  sheet: SessionAttendanceSheet;
  mutate: () => Promise<SessionAttendanceSheet | null | undefined>;
  setSnackbar: (val: { open: boolean; message: string; severity: "success" | "error" }) => void;
}

function AttendanceSheetDetail({
  sessionId,
  sheet,
  mutate,
  setSnackbar,
}: AttendanceSheetDetailProps) {
  const [topic, setTopic] = useState<string>(sheet.topic ?? "");
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: AttendanceStatusType; note: string }>
  >(() => {
    const initial: Record<string, { status: AttendanceStatusType; note: string }> = {};
    sheet.students.forEach((s) => {
      initial[s.studentId] = {
        status: s.status === "NotRecorded" ? "Present" : (s.status as AttendanceStatusType),
        note: s.note ?? "",
      };
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Thao tác đánh dấu tất cả có mặt
  const handleMarkAllPresent = () => {
    const next: Record<string, { status: AttendanceStatusType; note: string }> = { ...attendanceRecords };
    sheet.students.forEach((s) => {
      next[s.studentId] = {
        status: "Present",
        note: next[s.studentId]?.note ?? "",
      };
    });
    setAttendanceRecords(next);
  };

  // Thay đổi trạng thái của 1 học viên
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatusType | null) => {
    if (!newStatus) return;
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        status: newStatus,
        note: prev[studentId]?.note ?? "",
      },
    }));
  };

  // Thay đổi ghi chú của 1 học viên
  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status ?? "Present",
        note,
      },
    }));
  };

  // Tính toán số liệu thống kê realtime từ local state
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    sheet.students.forEach((s) => {
      const rec = attendanceRecords[s.studentId];
      const st = rec ? rec.status : s.status;
      if (st === "Present") present++;
      else if (st === "Late") late++;
      else if (st === "Absent") absent++;
      else if (st === "Excused") excused++;
    });

    return {
      total: sheet.students.length,
      present,
      late,
      absent,
      excused,
    };
  }, [sheet.students, attendanceRecords]);

  // Lưu sổ điểm danh theo lô
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payloadItems: AttendanceItemPayload[] = sheet.students.map((s) => {
        const rec = attendanceRecords[s.studentId];
        const statusType = rec ? rec.status : "Present";
        return {
          studentId: s.studentId,
          status: STATUS_TO_INT[statusType] ?? 1,
          note: rec?.note ? rec.note.trim() : undefined,
        };
      });

      await attendanceService.saveAttendance(sessionId, {
        topic: topic.trim() || undefined,
        attendances: payloadItems,
      });

      await mutate();
      setSnackbar({
        open: true,
        message: "Lưu sổ điểm danh thành công!",
        severity: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu điểm danh.";
      setSnackbar({
        open: true,
        message: msg,
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* 4 Thẻ KPI thống kê chuyên cần */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderLeft: 4,
            borderLeftColor: "primary.main",
          }}
        >
          <PeopleAltRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Tổng sĩ số
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {stats.total}
            </Typography>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderLeft: 4,
            borderLeftColor: "success.main",
          }}
        >
          <CheckCircleRoundedIcon sx={{ fontSize: 32, color: "success.main" }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Có mặt
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "success.main" }}>
              {stats.present}
            </Typography>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderLeft: 4,
            borderLeftColor: "warning.main",
          }}
        >
          <AccessTimeFilledRoundedIcon sx={{ fontSize: 32, color: "warning.main" }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Đi muộn
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "warning.main" }}>
              {stats.late}
            </Typography>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderLeft: 4,
            borderLeftColor: "error.main",
          }}
        >
          <CancelRoundedIcon sx={{ fontSize: 32, color: "error.main" }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Vắng mặt
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "error.main" }}>
              {stats.absent}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Cập nhật Chủ đề & Nút Thao tác */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          label="Chủ đề bài giảng (Topic)"
          placeholder="VD: Cấu trúc dữ liệu & Thuật toán cơ bản..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          sx={{ flex: 1 }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            color="success"
            onClick={handleMarkAllPresent}
            startIcon={<DoneAllRoundedIcon />}
            sx={{ fontWeight: 600, textTransform: "none", whiteSpace: "nowrap" }}
          >
            Đánh dấu tất cả Có mặt
          </Button>

          <Button
            variant="contained"
            color="primary"
            disabled={isSaving}
            onClick={handleSave}
            startIcon={
              isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />
            }
            sx={{ fontWeight: 700, px: 3, textTransform: "none", whiteSpace: "nowrap" }}
          >
            Lưu sổ điểm danh
          </Button>
        </Box>
      </Paper>

      {/* Bảng danh sách học viên điểm danh */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200, fontWeight: 700 }}>Học viên</TableCell>
                <TableCell sx={{ minWidth: 320, fontWeight: 700 }}>Trạng thái điểm danh</TableCell>
                <TableCell sx={{ minWidth: 250, fontWeight: 700 }}>Ghi chú của giảng viên</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sheet.students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Chưa có học viên nào được ghi danh vào lớp học này.
                  </TableCell>
                </TableRow>
              ) : (
                sheet.students.map((student) => {
                  const rec = attendanceRecords[student.studentId];
                  const currentStatus = rec ? rec.status : "Present";
                  const currentNote = rec ? rec.note : "";

                  return (
                    <TableRow key={student.studentId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {student.studentName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.studentEmail}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <ToggleButtonGroup
                          size="small"
                          exclusive
                          value={currentStatus}
                          onChange={(_, val) => handleStatusChange(student.studentId, val)}
                          sx={{
                            "& .MuiToggleButton-root": {
                              px: 1.5,
                              py: 0.5,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "none",
                            },
                          }}
                        >
                          <ToggleButton
                            value="Present"
                            sx={{
                              "&.Mui-selected": {
                                bgcolor: "success.main",
                                color: "#fff",
                                "&:hover": { bgcolor: "success.dark" },
                              },
                            }}
                          >
                            Có mặt
                          </ToggleButton>
                          <ToggleButton
                            value="Late"
                            sx={{
                              "&.Mui-selected": {
                                bgcolor: "warning.main",
                                color: "#fff",
                                "&:hover": { bgcolor: "warning.dark" },
                              },
                            }}
                          >
                            Đi muộn
                          </ToggleButton>
                          <ToggleButton
                            value="Excused"
                            sx={{
                              "&.Mui-selected": {
                                bgcolor: "info.main",
                                color: "#fff",
                                "&:hover": { bgcolor: "info.dark" },
                              },
                            }}
                          >
                            Có phép
                          </ToggleButton>
                          <ToggleButton
                            value="Absent"
                            sx={{
                              "&.Mui-selected": {
                                bgcolor: "error.main",
                                color: "#fff",
                                "&:hover": { bgcolor: "error.dark" },
                              },
                            }}
                          >
                            Vắng mặt
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Nhập ghi chú (nếu có)..."
                          value={currentNote}
                          onChange={(e) => handleNoteChange(student.studentId, e.target.value)}
                          sx={{ fontSize: "0.8125rem" }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}

export function AttendanceView({ tenantSlug }: AttendanceViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Nhận classId và sessionId từ URL
  const selectedClassId = searchParams.get("classId") ?? "";
  const selectedSessionId = searchParams.get("sessionId") ?? "";

  // Danh sách lớp học
  const { classes, isLoading: isClassesLoading } = useClasses(tenantSlug);

  // Chi tiết lớp học & danh sách buổi học
  const { sessions, isLoading: isSessionsLoading } = useClassDetail(
    selectedClassId || null,
    tenantSlug
  );

  // Sổ điểm danh của buổi học được chọn
  const { sheet, isLoading: isSheetLoading, isError, error, mutate } = useSessionAttendance(
    selectedSessionId || null,
    tenantSlug
  );

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const updateUrlParams = (newClassId: string, newSessionId: string) => {
    const params = new URLSearchParams();
    if (newClassId) params.set("classId", newClassId);
    if (newSessionId) params.set("sessionId", newSessionId);
    const queryString = params.toString();
    router.replace(`/${tenantSlug}/attendance${queryString ? `?${queryString}` : ""}`);
  };

  const handleClassChange = (newClassId: string) => {
    updateUrlParams(newClassId, "");
  };

  const handleSessionChange = (newSessionId: string) => {
    updateUrlParams(selectedClassId, newSessionId);
  };

  return (
    <Box sx={{ width: "100%", pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant="text"
            color="inherit"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => router.push(`/${tenantSlug}/schedule`)}
            sx={{ textTransform: "none", fontWeight: 600, mr: 1 }}
          >
            Thời khóa biểu
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Sổ điểm danh buổi học
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Ghi nhận chuyên cần, cập nhật chủ đề bài giảng và báo cáo sĩ số buổi học
        </Typography>
      </Box>

      {/* Bộ chọn Lớp học và Buổi học */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          bgcolor: (theme) => (theme.palette.mode === "dark" ? "background.paper" : "grey.50"),
        }}
      >
        <FormControl fullWidth size="small" sx={{ flex: 1 }}>
          <InputLabel id="attendance-class-select-label">Chọn lớp học</InputLabel>
          <Select
            labelId="attendance-class-select-label"
            value={selectedClassId}
            label="Chọn lớp học"
            disabled={isClassesLoading}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name} ({cls.courseTitle})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ flex: 1 }}>
          <InputLabel id="attendance-session-select-label">Chọn buổi học</InputLabel>
          <Select
            labelId="attendance-session-select-label"
            value={selectedSessionId}
            label="Chọn buổi học"
            disabled={!selectedClassId || isSessionsLoading}
            onChange={(e) => handleSessionChange(e.target.value)}
          >
            {sessions.length === 0 ? (
              <MenuItem disabled value="">
                {isSessionsLoading ? "Đang tải buổi học..." : "Lớp học chưa có buổi học"}
              </MenuItem>
            ) : (
              sessions.map((s) => {
                const sDate = new Date(s.startTime).toLocaleDateString("vi-VN");
                const sStart = new Date(s.startTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <MenuItem key={s.id} value={s.id}>
                    Buổi {s.sessionNumber} — {sDate} ({sStart}){s.topic ? `: ${s.topic}` : ""}
                  </MenuItem>
                );
              })
            )}
          </Select>
        </FormControl>
      </Paper>

      {/* Khi chưa chọn buổi học */}
      {!selectedSessionId ? (
        <Paper
          variant="outlined"
          sx={{
            py: 8,
            textAlign: "center",
            borderRadius: 2,
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "background.paper" : "grey.50"),
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, color: "text.secondary" }}>
            Vui lòng chọn lớp học và buổi học để mở sổ điểm danh
          </Typography>
        </Paper>
      ) : isSheetLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
            {Array.from(new Array(4)).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={90} />
            ))}
          </Box>
          <Skeleton variant="rounded" height={300} />
        </Box>
      ) : isError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.message || "Không thể tải sổ điểm danh của buổi học này."}
        </Alert>
      ) : !sheet ? null : (
        <AttendanceSheetDetail
          key={selectedSessionId}
          sessionId={selectedSessionId}
          sheet={sheet}
          mutate={mutate}
          setSnackbar={setSnackbar}
        />
      )}

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AttendanceView;
