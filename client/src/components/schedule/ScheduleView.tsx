"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Skeleton,
  Tooltip,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import RoomRoundedIcon from "@mui/icons-material/RoomRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import { useSchedule } from "@/hooks/useSchedule";
import { useClasses, useTeachers } from "@/hooks/useClasses";
import { useCurrentRole } from "@/hooks/useCurrentRole";
import type { ScheduleSession } from "@/types/schedule";

interface ScheduleViewProps {
  tenantSlug: string;
}

// Hàm tính ngày Thứ 2 của một ngày bất kỳ
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Định dạng ngày theo chuẩn YYYY-MM-DD cho API params
function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ Nhật",
];

export function ScheduleView({ tenantSlug }: ScheduleViewProps) {
  const router = useRouter();
  const { isCenterAdmin, isTeacher, isStudent } = useCurrentRole();

  // State tuần hiện tại (bắt đầu từ Thứ 2)
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));

  // State bộ lọc dành cho CenterAdmin
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // Danh sách các ngày trong tuần (Thứ 2 đến Chủ Nhật)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      return d;
    });
  }, [currentMonday]);

  const sunday = weekDays[6];

  // Tham số truy vấn thời khóa biểu
  const filterParams = useMemo(() => {
    return {
      from: formatDateToIso(currentMonday),
      to: formatDateToIso(sunday),
      classId: selectedClassId || undefined,
      teacherId: selectedTeacherId || undefined,
    };
  }, [currentMonday, sunday, selectedClassId, selectedTeacherId]);

  const { sessions, isLoading, isError, error, mutate } = useSchedule(
    filterParams,
    tenantSlug
  );

  const { classes } = useClasses(tenantSlug);
  const { teachers } = useTeachers(tenantSlug);

  // Điều hướng tuần
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(currentMonday.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(currentMonday.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleThisWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Gom nhóm các buổi học theo từng ngày trong tuần
  const sessionsByDay = useMemo(() => {
    const map = new Map<number, ScheduleSession[]>();
    for (let i = 0; i < 7; i++) {
      map.set(i, []);
    }

    sessions.forEach((session) => {
      const sessionDate = new Date(session.startTime);
      const sessionDateStr = formatDateToIso(sessionDate);

      const dayIndex = weekDays.findIndex(
        (wd) => formatDateToIso(wd) === sessionDateStr
      );

      if (dayIndex >= 0) {
        map.get(dayIndex)?.push(session);
      }
    });

    return map;
  }, [sessions, weekDays]);

  // Kiểm tra ngày hôm nay
  const todayStr = formatDateToIso(new Date());

  const getAttendanceChip = (status: string | null) => {
    switch (status) {
      case "Present":
        return <Chip label="Có mặt" size="small" color="success" sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }} />;
      case "Absent":
        return <Chip label="Vắng mặt" size="small" color="error" sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }} />;
      case "Late":
        return <Chip label="Đi muộn" size="small" color="warning" sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }} />;
      case "Excused":
        return <Chip label="Có phép" size="small" color="info" sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }} />;
      default:
        return <Chip label="Chưa học" size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.7rem", height: 22 }} />;
    }
  };

  return (
    <Box sx={{ width: "100%", pb: 6 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Thời khóa biểu tuần
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theo dõi và điều phối lịch học, điểm danh chuyên cần của các lớp đào tạo
          </Typography>
        </Box>

        {/* Thanh chuyển tuần */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Tuần trước">
            <IconButton onClick={handlePrevWeek} size="small" aria-label="Tuần trước">
              <ChevronLeftRoundedIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            onClick={handleThisWeek}
            startIcon={<TodayRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{ fontWeight: 600, textTransform: "none" }}
          >
            Tuần này
          </Button>
          <Tooltip title="Tuần sau">
            <IconButton onClick={handleNextWeek} size="small" aria-label="Tuần sau">
              <ChevronRightRoundedIcon />
            </IconButton>
          </Tooltip>

          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              ml: 1,
              px: 1.5,
              py: 0.5,
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "background.paper" : "grey.100"),
              borderRadius: 1.5,
              border: 1,
              borderColor: "divider",
            }}
          >
            {currentMonday.toLocaleDateString("vi-VN")} — {sunday.toLocaleDateString("vi-VN")}
          </Typography>
        </Box>
      </Box>

      {/* Bộ lọc cho CenterAdmin */}
      {isCenterAdmin && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "background.paper" : "grey.50"),
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id="schedule-class-filter-label">Lọc theo lớp học</InputLabel>
            <Select
              labelId="schedule-class-filter-label"
              value={selectedClassId}
              label="Lọc theo lớp học"
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <MenuItem value="">Tất cả lớp học</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.courseTitle})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id="schedule-teacher-filter-label">Lọc theo giảng viên</InputLabel>
            <Select
              labelId="schedule-teacher-filter-label"
              value={selectedTeacherId}
              label="Lọc theo giảng viên"
              onChange={(e) => setSelectedTeacherId(e.target.value)}
            >
              <MenuItem value="">Tất cả giảng viên</MenuItem>
              {teachers.map((t) => (
                <MenuItem key={t.userId} value={t.userId}>
                  {t.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(selectedClassId || selectedTeacherId) && (
            <Button
              variant="text"
              color="inherit"
              size="small"
              onClick={() => {
                setSelectedClassId("");
                setSelectedTeacherId("");
              }}
              sx={{ alignSelf: "center", textTransform: "none" }}
            >
              Đặt lại
            </Button>
          )}
        </Paper>
      )}

      {/* Thông báo lỗi khi fetch */}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => mutate()}>
              Thử lại
            </Button>
          }
        >
          {error?.message || "Không thể tải thời khóa biểu tuần này."}
        </Alert>
      )}

      {/* Lưới 7 ngày trong tuần */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
            lg: "repeat(7, 1fr)",
          },
          gap: 1.5,
          alignItems: "start",
        }}
      >
        {weekDays.map((day, idx) => {
          const dateStr = formatDateToIso(day);
          const isToday = dateStr === todayStr;
          const daySessions = sessionsByDay.get(idx) ?? [];

          return (
            <Paper
              key={idx}
              variant="outlined"
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                minHeight: 380,
                display: "flex",
                flexDirection: "column",
                borderTop: 4,
                borderTopColor: isToday ? "primary.main" : "transparent",
                bgcolor: (theme) =>
                  isToday
                    ? theme.palette.mode === "dark"
                      ? "rgba(99, 102, 241, 0.08)"
                      : "rgba(99, 102, 241, 0.03)"
                    : theme.palette.mode === "dark"
                    ? "background.paper"
                    : "grey.50",
              }}
            >
              {/* Day Header */}
              <Box
                sx={{
                  p: 1.5,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: isToday ? "primary.main" : "text.primary",
                    }}
                  >
                    {DAY_NAMES[idx]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  </Typography>
                </Box>
                {isToday && (
                  <Chip
                    label="Hôm nay"
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700, fontSize: "0.675rem", height: 20 }}
                  />
                )}
              </Box>

              {/* Day Sessions List */}
              <Box sx={{ p: 1.25, flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
                {isLoading ? (
                  Array.from(new Array(2)).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={100} />
                  ))
                ) : daySessions.length === 0 ? (
                  <Box
                    sx={{
                      py: 4,
                      textAlign: "center",
                      color: "text.disabled",
                    }}
                  >
                    <Typography variant="caption">Không có lịch</Typography>
                  </Box>
                ) : (
                  daySessions.map((s) => {
                    const startTimeStr = new Date(s.startTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const endTimeStr = new Date(s.endTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <Paper
                        key={s.sessionId}
                        elevation={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          borderLeft: 3,
                          borderLeftColor: "primary.main",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.75,
                          transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 3,
                          },
                        }}
                      >
                        {/* Khung giờ học */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: "primary.main",
                              bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)"),
                              px: 0.75,
                              py: 0.2,
                              borderRadius: 1,
                            }}
                          >
                            {startTimeStr} - {endTimeStr}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Buổi {s.sessionNumber}
                          </Typography>
                        </Box>

                        {/* Tên lớp học & Khóa */}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                            {s.className}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {s.courseTitle}
                          </Typography>
                        </Box>

                        {/* Chủ đề buổi học */}
                        {s.topic && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontStyle: "italic",
                              color: "text.secondary",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {s.topic}
                          </Typography>
                        )}

                        {/* Thông tin phòng & Giảng viên */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, pt: 0.5, borderTop: 1, borderColor: "divider" }}>
                          {s.roomName && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <RoomRoundedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                              <Typography variant="caption" color="text.secondary">
                                {s.roomName}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <PersonRoundedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                            <Typography variant="caption" color="text.secondary">
                              {s.teacherName}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Thao tác điểm danh / Trạng thái học viên */}
                        <Box sx={{ pt: 0.75, mt: "auto", display: "flex", justifyContent: "flex-end" }}>
                          {isStudent ? (
                            getAttendanceChip(s.myAttendanceStatus)
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<HowToRegRoundedIcon sx={{ fontSize: 14 }} />}
                              onClick={() =>
                                router.push(
                                  `/${tenantSlug}/attendance?classId=${s.classId}&sessionId=${s.sessionId}`
                                )
                              }
                              sx={{
                                fontSize: "0.7rem",
                                py: 0.3,
                                px: 1,
                                textTransform: "none",
                                fontWeight: 600,
                              }}
                            >
                              Điểm danh
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    );
                  })
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

export default ScheduleView;
