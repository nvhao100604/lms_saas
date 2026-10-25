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
  ToggleButton,
  ToggleButtonGroup,
  Drawer,
  CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RoomRoundedIcon from "@mui/icons-material/RoomRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { useClasses, useClassDetail, useTeachers } from "@/hooks/useClasses";
import { useCourses } from "@/hooks/useCourses";
import { classService } from "@/services/classService";
import { formatDate } from "@/lib/utils";
import type {
  ClassResponse,
  ClassStatus,
  CreateClassRequest,
} from "@/types/class";
import { AppApiError } from "@/lib/axios";

interface ClassesViewProps {
  tenantSlug: string;
}

// Danh sách các thứ trong tuần (0: Chủ Nhật, 1: Thứ 2 -> 6: Thứ 7)
const DAYS_OF_WEEK_OPTIONS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ Nhật" },
];

export function ClassesView({ tenantSlug }: ClassesViewProps) {
  const { classes, isLoading, isError, error, isValidating, mutate } =
    useClasses(tenantSlug);
  const { courses } = useCourses(tenantSlug);
  const { teachers, isLoading: isTeachersLoading } = useTeachers(tenantSlug);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // State Modal Tạo mới lớp học
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    courseId: string;
    teacherId: string;
    name: string;
    roomName: string;
    startDate: string;
    endDate: string;
    maxCapacity: number;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  }>({
    courseId: "",
    teacherId: "",
    name: "",
    roomName: "",
    startDate: "",
    endDate: "",
    maxCapacity: 30,
    daysOfWeek: [1, 3, 5],
    startTime: "18:30",
    endTime: "20:30",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // State Drawer Xem chi tiết buổi học (Sessions)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const {
    classDetail,
    sessions,
    isLoading: isSessionsLoading,
  } = useClassDetail(selectedClassId, tenantSlug);

  // State cập nhật trạng thái nhanh (PATCH status)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Lọc dữ liệu lớp học
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchSearch =
        cls.name.toLowerCase().includes(search.toLowerCase()) ||
        cls.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
        cls.teacherName.toLowerCase().includes(search.toLowerCase()) ||
        (cls.roomName || "").toLowerCase().includes(search.toLowerCase());

      if (filterStatus === "all") return matchSearch;
      return matchSearch && cls.status === filterStatus;
    });
  }, [classes, search, filterStatus]);

  // Xử lý tạo mới lớp học
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.courseId) {
      setCreateError("Vui lòng chọn khóa học đào tạo.");
      return;
    }
    if (!createForm.teacherId) {
      setCreateError("Vui lòng chọn giảng viên phụ trách.");
      return;
    }
    if (!createForm.name.trim()) {
      setCreateError("Vui lòng nhập tên lớp học.");
      return;
    }
    if (!createForm.startDate || !createForm.endDate) {
      setCreateError("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.");
      return;
    }
    if (createForm.startDate > createForm.endDate) {
      setCreateError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }
    if (createForm.daysOfWeek.length === 0) {
      setCreateError("Vui lòng chọn ít nhất 1 thứ trong tuần cho lịch học.");
      return;
    }
    if (createForm.startTime >= createForm.endTime) {
      setCreateError("Giờ bắt đầu buổi học phải trước giờ kết thúc.");
      return;
    }

    const payload: CreateClassRequest = {
      courseId: createForm.courseId,
      teacherId: createForm.teacherId,
      name: createForm.name.trim(),
      roomName: createForm.roomName.trim() || null,
      startDate: createForm.startDate,
      endDate: createForm.endDate,
      maxCapacity: Number(createForm.maxCapacity) || 30,
      schedule: {
        daysOfWeek: createForm.daysOfWeek,
        startTime:
          createForm.startTime.length === 5
            ? `${createForm.startTime}:00`
            : createForm.startTime,
        endTime:
          createForm.endTime.length === 5
            ? `${createForm.endTime}:00`
            : createForm.endTime,
      },
    };

    try {
      setIsCreating(true);
      setCreateError(null);
      await classService.createClass(payload);
      await mutate();
      setIsCreateOpen(false);
      setCreateForm({
        courseId: "",
        teacherId: "",
        name: "",
        roomName: "",
        startDate: "",
        endDate: "",
        maxCapacity: 30,
        daysOfWeek: [1, 3, 5],
        startTime: "18:30",
        endTime: "20:30",
      });
      setSnackbar({
        open: true,
        message: "Mở lớp học thành công và đã tự động xếp lịch!",
        severity: "success",
      });
    } catch (err) {
      if (err instanceof AppApiError) {
        setCreateError(err.message);
      } else {
        setCreateError("Không thể tạo lớp học. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Cập nhật trạng thái lớp học qua HTTP PATCH { status }
  const handleStatusChange = async (cls: ClassResponse, newStatus: ClassStatus) => {
    if (cls.status === newStatus) return;

    try {
      setUpdatingStatusId(cls.id);
      await classService.patchClass(cls.id, { status: newStatus });
      await mutate();
      setSnackbar({
        open: true,
        message: `Đã cập nhật trạng thái lớp "${cls.name}" thành công!`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err instanceof AppApiError
            ? err.message
            : "Không thể cập nhật trạng thái lớp học.",
        severity: "error",
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getStatusLabel = (status: ClassStatus) => {
    switch (status) {
      case "Upcoming":
        return "Tuyển sinh";
      case "Ongoing":
        return "Đang học";
      case "Completed":
        return "Hoàn thành";
      case "Cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header Điều khiển & Bộ lọc */}
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
          }}
        >
          {/* Thanh tìm kiếm */}
          <TextField
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên lớp, khóa học, giảng viên, phòng..."
            sx={{ minWidth: { xs: "100%", sm: 320 } }}
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

          {/* Filter Status Pills */}
          <Box sx={{ display: "flex", gap: 0.5, overflowX: "auto" }}>
            {["all", "Upcoming", "Ongoing", "Completed", "Cancelled"].map((st) => (
              <Button
                key={st}
                size="small"
                variant={filterStatus === st ? "contained" : "outlined"}
                color={filterStatus === st ? "primary" : "inherit"}
                onClick={() => setFilterStatus(st)}
                sx={{
                  borderColor: "divider",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {st === "all"
                  ? `Tất cả (${classes.length})`
                  : getStatusLabel(st as ClassStatus)}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Nút hành động */}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => mutate()}
            disabled={isValidating}
            startIcon={
              isValidating ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <RefreshRoundedIcon fontSize="small" />
              )
            }
            sx={{ borderColor: "divider", color: "text.primary" }}
          >
            {isValidating ? "Đang đồng bộ..." : "Làm mới"}
          </Button>

          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => {
              setIsCreateOpen(true);
              setCreateError(null);
            }}
            startIcon={<AddRoundedIcon fontSize="small" />}
          >
            Mở lớp học mới
          </Button>
        </Box>
      </Box>

      {/* Thông báo lỗi khi fetch */}
      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => mutate()}>
              Thử lại
            </Button>
          }
        >
          {error?.message || "Không thể tải danh sách lớp học. Vui lòng thử lại."}
        </Alert>
      )}

      {/* Bảng danh sách lớp học (MUI TableContainer + Table) */}
      <Paper sx={{ overflow: "hidden", borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}>Tên lớp</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Khóa học</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Giảng viên</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Phòng học</TableCell>
                <TableCell sx={{ minWidth: 170 }}>Thời gian học</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Sĩ số</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Buổi học</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ minWidth: 110 }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from(new Array(5)).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Skeleton variant="text" width="80%" height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="70%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="50%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={40} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={60} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={80} height={24} />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton variant="rounded" width={70} height={28} sx={{ ml: "auto" }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" sx={{ color: "text.secondary", mb: 1 }}>
                      {search ? "Không tìm thấy lớp học phù hợp." : "Chưa có lớp học nào."}
                    </Typography>
                    {!search && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setIsCreateOpen(true)}
                        startIcon={<AddRoundedIcon fontSize="small" />}
                        sx={{ mt: 1 }}
                      >
                        Mở lớp học ngay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls) => {
                  const isUpdating = updatingStatusId === cls.id;
                  return (
                    <TableRow key={cls.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {cls.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cls.courseTitle}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: "rgba(79, 70, 229, 0.08)",
                            color: "primary.main",
                            borderRadius: 1.5,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <PersonRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {cls.teacherName || "Chưa phân công"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <RoomRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {cls.roomName || "Trực tuyến"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
                          {formatDate(cls.startDate)} &rarr; {formatDate(cls.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {cls.maxCapacity} học viên
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${cls.totalSessions} buổi`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={cls.status}
                          disabled={isUpdating}
                          onChange={(e) =>
                            handleStatusChange(cls, e.target.value as ClassStatus)
                          }
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            height: 28,
                            "& .MuiSelect-select": { py: 0.5, px: 1 },
                          }}
                        >
                          <MenuItem value="Upcoming">Tuyển sinh</MenuItem>
                          <MenuItem value="Ongoing">Đang học</MenuItem>
                          <MenuItem value="Completed">Hoàn thành</MenuItem>
                          <MenuItem value="Cancelled">Đã hủy</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => setSelectedClassId(cls.id)}
                          startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: "none", py: 0.4, px: 1.25 }}
                        >
                          Lịch học
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* =========================================================================
          HỘP THOẠI DIALOG: MỞ LỚP HỌC MỚI
         ========================================================================= */}
      <Dialog
        open={isCreateOpen}
        onClose={() => !isCreating && setIsCreateOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          Mở lớp học mới
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary", mt: 0.5 }}
          >
            Hệ thống sẽ tự động rải lịch các buổi học và kiểm tra chống trùng giờ giảng viên & hạn ngạch gói cước.
          </Typography>
        </DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              pt: 1.5,
            }}
          >
            {/* Hiển thị Alert severity="error" variant="filled" nổi bật khi gặp lỗi nghiệp vụ */}
            {createError && (
              <Alert severity="error" variant="filled" sx={{ fontWeight: 500 }}>
                {createError}
              </Alert>
            )}

            {/* Chọn Khóa học & Giảng viên qua FormControl + Select */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <FormControl fullWidth required size="small">
                <InputLabel id="course-select-label">Khóa học đào tạo *</InputLabel>
                <Select
                  labelId="course-select-label"
                  label="Khóa học đào tạo *"
                  value={createForm.courseId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, courseId: e.target.value })
                  }
                >
                  <MenuItem value="">
                    <em>-- Chọn khóa học --</em>
                  </MenuItem>
                  {courses
                    .filter((c) => c.isActive)
                    .map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.title}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required size="small">
                <InputLabel id="teacher-select-label">Giảng viên phụ trách *</InputLabel>
                <Select
                  labelId="teacher-select-label"
                  label="Giảng viên phụ trách *"
                  value={createForm.teacherId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, teacherId: e.target.value })
                  }
                >
                  <MenuItem value="">
                    <em>
                      {isTeachersLoading
                        ? "Đang tải danh sách giảng viên..."
                        : "-- Chọn giảng viên --"}
                    </em>
                  </MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.userId} value={teacher.userId}>
                      {teacher.fullName} ({teacher.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Tên lớp & Phòng học */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <TextField
                label="Tên lớp học"
                required
                fullWidth
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Ví dụ: IELTS Master K48"
              />
              <TextField
                label="Phòng học / Link học"
                fullWidth
                value={createForm.roomName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, roomName: e.target.value })
                }
                placeholder="Ví dụ: Phòng 302 hoặc Zoom Link"
              />
            </Box>

            {/* Ngày bắt đầu, Ngày kết thúc, Sĩ số tối đa */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <TextField
                label="Ngày bắt đầu"
                type="date"
                required
                fullWidth
                value={createForm.startDate}
                onChange={(e) =>
                  setCreateForm({ ...createForm, startDate: e.target.value })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="Ngày kết thúc"
                type="date"
                required
                fullWidth
                value={createForm.endDate}
                onChange={(e) =>
                  setCreateForm({ ...createForm, endDate: e.target.value })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="Sĩ số tối đa"
                type="number"
                required
                fullWidth
                value={createForm.maxCapacity}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    maxCapacity: Number(e.target.value),
                  })
                }
                slotProps={{
                  input: { inputProps: { min: 1, max: 500 } },
                }}
              />
            </Box>

            {/* Chọn các thứ học trong tuần bằng ToggleButtonGroup của MUI */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Lịch học định kỳ các thứ trong tuần:
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                Chọn các ngày giảng dạy diễn ra trong tuần:
              </Typography>

              <ToggleButtonGroup
                value={createForm.daysOfWeek}
                onChange={(_, newDays) => {
                  if (newDays && newDays.length > 0) {
                    setCreateForm({ ...createForm, daysOfWeek: newDays });
                  }
                }}
                aria-label="Các thứ học trong tuần"
                size="small"
                sx={{ flexWrap: "wrap", gap: 0.5 }}
              >
                {DAYS_OF_WEEK_OPTIONS.map((opt) => (
                  <ToggleButton
                    key={opt.value}
                    value={opt.value}
                    sx={{
                      px: 2,
                      py: 0.75,
                      borderRadius: "8px !important",
                      border: "1px solid #e2e8f0 !important",
                      "&.Mui-selected": {
                        bgcolor: "primary.main !important",
                        color: "#fff !important",
                      },
                    }}
                  >
                    {opt.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {/* Khung giờ học */}
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <TextField
                  label="Giờ bắt đầu"
                  type="time"
                  required
                  fullWidth
                  value={createForm.startTime}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, startTime: e.target.value })
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Giờ kết thúc"
                  type="time"
                  required
                  fullWidth
                  value={createForm.endTime}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, endTime: e.target.value })
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              variant="outlined"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
              sx={{ borderColor: "divider", color: "text.secondary" }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating}
              startIcon={
                isCreating ? <CircularProgress size={14} color="inherit" /> : null
              }
            >
              {isCreating ? "Đang xếp lịch..." : "Xác nhận mở lớp"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* =========================================================================
          DRAWER: XEM LỊCH TRÌNH BUỔI HỌC (SESSIONS)
         ========================================================================= */}
      <Drawer
        anchor="right"
        open={Boolean(selectedClassId)}
        onClose={() => setSelectedClassId(null)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 480 },
              boxSizing: "border-box",
              p: 0,
            },
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Drawer Header */}
          <Box
            sx={{
              p: 2.5,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Lịch trình buổi học
              </Typography>
              <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600 }}>
                {classDetail?.name || "Đang tải thông tin lớp..."}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                Khóa: {classDetail?.courseTitle} | Giảng viên: {classDetail?.teacherName}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setSelectedClassId(null)}
              sx={{ color: "text.secondary" }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Drawer Body - Danh sách sessions */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
            {isSessionsLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {Array.from(new Array(5)).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={60} />
                ))}
              </Box>
            ) : sessions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Chưa có thông tin buổi học nào được ghi nhận.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {sessions.map((session) => {
                  const start = new Date(session.startTime);
                  const end = new Date(session.endTime);
                  const timeStr = `${start.getUTCHours().toString().padStart(2, "0")}:${start.getUTCMinutes().toString().padStart(2, "0")} - ${end.getUTCHours().toString().padStart(2, "0")}:${end.getUTCMinutes().toString().padStart(2, "0")} (UTC)`;

                  return (
                    <Paper
                      key={session.id}
                      variant="outlined"
                      sx={{
                        p: 1.75,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: 2,
                        transition: "all 0.15s ease",
                        "&:hover": { bgcolor: "grey.50" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Chip
                          label={`#${session.sessionNumber}`}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {session.topic || `Buổi học ${session.sessionNumber}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Ngày: {formatDate(session.startTime)}
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={timeStr}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          bgcolor: "background.paper",
                        }}
                      />
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Drawer Footer */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedClassId(null)}
              sx={{ borderColor: "divider", color: "text.secondary" }}
            >
              Đóng ngăn kéo
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Snackbar thông báo thao tác */}
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

export default ClassesView;
