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
  Switch,
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
  FormControlLabel,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { useCourses } from "@/hooks/useCourses";
import { courseService } from "@/services/courseService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  CourseResponse,
  CreateCourseRequest,
  PatchCourseRequest,
} from "@/types/course";
import { AppApiError } from "@/lib/axios";

interface CoursesViewProps {
  tenantSlug: string;
}

export function CoursesView({ tenantSlug }: CoursesViewProps) {
  const { courses, isLoading, isError, error, isValidating, mutate } =
    useCourses(tenantSlug);

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // State Modal Tạo mới
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCourseRequest>({
    title: "",
    description: "",
    tuitionFee: 0,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // State Modal Chỉnh sửa nhanh (PATCH)
  const [editingCourse, setEditingCourse] = useState<CourseResponse | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    tuitionFee: number;
    isActive: boolean;
  }>({
    title: "",
    description: "",
    tuitionFee: 0,
    isActive: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // State Dialog Xác nhận Xóa
  const [deletingCourse, setDeletingCourse] = useState<CourseResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State Switch toggling & Snackbar
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Lọc dữ liệu hiển thị
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description?.toLowerCase() || "").includes(search.toLowerCase());

      if (filterActive === "active") return matchSearch && c.isActive;
      if (filterActive === "inactive") return matchSearch && !c.isActive;
      return matchSearch;
    });
  }, [courses, search, filterActive]);

  // Xử lý tạo mới khóa học
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      setCreateError("Vui lòng nhập tiêu đề khóa học.");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      await courseService.createCourse({
        title: createForm.title.trim(),
        description: createForm.description?.trim() || null,
        tuitionFee: Number(createForm.tuitionFee) || 0,
      });

      await mutate();
      setIsCreateOpen(false);
      setCreateForm({ title: "", description: "", tuitionFee: 0 });
      setSnackbar({
        open: true,
        message: "Tạo khóa học thành công!",
        severity: "success",
      });
    } catch (err) {
      if (err instanceof AppApiError) {
        setCreateError(err.message);
      } else {
        setCreateError("Không thể tạo khóa học. Vui lòng thử lại.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (course: CourseResponse) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title,
      description: course.description || "",
      tuitionFee: course.tuitionFee,
      isActive: course.isActive,
    });
    setEditError(null);
  };

  // Xử lý cập nhật từng phần (HTTP PATCH)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    // Tính toán diff: chỉ gửi các thuộc tính thực sự thay đổi
    const patchPayload: PatchCourseRequest = {};
    if (editForm.title.trim() !== editingCourse.title) {
      patchPayload.title = editForm.title.trim();
    }
    if ((editForm.description.trim() || null) !== editingCourse.description) {
      patchPayload.description = editForm.description.trim() || null;
    }
    if (Number(editForm.tuitionFee) !== editingCourse.tuitionFee) {
      patchPayload.tuitionFee = Number(editForm.tuitionFee);
    }
    if (editForm.isActive !== editingCourse.isActive) {
      patchPayload.isActive = editForm.isActive;
    }

    // Nếu không có thay đổi nào, đóng modal ngay
    if (Object.keys(patchPayload).length === 0) {
      setEditingCourse(null);
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);
      await courseService.patchCourse(editingCourse.id, patchPayload);
      await mutate();
      setEditingCourse(null);
      setSnackbar({
        open: true,
        message: "Cập nhật khóa học thành công!",
        severity: "success",
      });
    } catch (err) {
      if (err instanceof AppApiError) {
        setEditError(err.message);
      } else {
        setEditError("Không thể cập nhật khóa học. Vui lòng thử lại.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Bật/tắt trạng thái trực tiếp qua switch (gọi patchCourse(id, { isActive }) rồi mutate())
  const handleToggleActive = async (course: CourseResponse) => {
    try {
      setTogglingId(course.id);
      await courseService.patchCourse(course.id, { isActive: !course.isActive });
      await mutate();
      setSnackbar({
        open: true,
        message: `Đã ${!course.isActive ? "kích hoạt" : "tạm dừng"} khóa học "${course.title}"`,
        severity: "info",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof AppApiError ? err.message : "Lỗi cập nhật trạng thái.",
        severity: "error",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Xử lý xác nhận xóa khóa học
  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await courseService.deleteCourse(deletingCourse.id);
      await mutate();
      setDeletingCourse(null);
      setSnackbar({
        open: true,
        message: `Đã xóa khóa học "${deletingCourse.title}"`,
        severity: "success",
      });
    } catch (err) {
      if (err instanceof AppApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError("Không thể xóa khóa học. Vui lòng thử lại.");
      }
    } finally {
      setIsDeleting(false);
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
            placeholder="Tìm kiếm khóa học theo tên hoặc mô tả..."
            sx={{ minWidth: { xs: "100%", sm: 300 } }}
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

          {/* Nhóm nút lọc trạng thái */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button
              size="small"
              variant={filterActive === "all" ? "contained" : "outlined"}
              color={filterActive === "all" ? "primary" : "inherit"}
              onClick={() => setFilterActive("all")}
              sx={{ borderColor: "divider", textTransform: "none" }}
            >
              Tất cả ({courses.length})
            </Button>
            <Button
              size="small"
              variant={filterActive === "active" ? "contained" : "outlined"}
              color={filterActive === "active" ? "success" : "inherit"}
              onClick={() => setFilterActive("active")}
              sx={{ borderColor: "divider", textTransform: "none" }}
            >
              Đang mở ({courses.filter((c) => c.isActive).length})
            </Button>
            <Button
              size="small"
              variant={filterActive === "inactive" ? "contained" : "outlined"}
              color={filterActive === "inactive" ? "inherit" : "inherit"}
              onClick={() => setFilterActive("inactive")}
              sx={{
                borderColor: "divider",
                textTransform: "none",
                bgcolor: filterActive === "inactive" ? "grey.200" : "transparent",
              }}
            >
              Tạm ngưng ({courses.filter((c) => !c.isActive).length})
            </Button>
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
            onClick={() => setIsCreateOpen(true)}
            startIcon={<AddRoundedIcon fontSize="small" />}
          >
            Tạo khóa học
          </Button>
        </Box>
      </Box>

      {/* Thông báo lỗi khi fetch dữ liệu */}
      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => mutate()}>
              Thử lại
            </Button>
          }
        >
          {error?.message || "Không thể tải danh sách khóa học. Vui lòng kiểm tra kết nối."}
        </Alert>
      )}

      {/* Bảng danh sách khóa học (MUI TableContainer + Table) */}
      <Paper sx={{ overflow: "hidden", borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 240 }}>Khóa học</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Học phí tiêu chuẩn</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Trạng thái</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Kích hoạt</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Ngày tạo</TableCell>
                <TableCell align="right" sx={{ minWidth: 100 }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from(new Array(5)).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Skeleton variant="text" width="70%" height={24} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={80} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={70} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="circular" width={32} height={32} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={90} />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton variant="circular" width={28} height={28} sx={{ ml: "auto" }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" sx={{ color: "text.secondary", mb: 1 }}>
                      {search ? "Không tìm thấy khóa học phù hợp." : "Chưa có khóa học nào."}
                    </Typography>
                    {!search && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setIsCreateOpen(true)}
                        startIcon={<AddRoundedIcon fontSize="small" />}
                        sx={{ mt: 1 }}
                      >
                        Tạo khóa học ngay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => {
                  const isToggling = togglingId === course.id;
                  return (
                    <TableRow key={course.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {course.title}
                        </Typography>
                        {course.description && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {course.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "primary.main" }}
                        >
                          {formatCurrency(course.tuitionFee)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={course.isActive ? "Đang mở" : "Tạm ngưng"}
                          color={course.isActive ? "success" : "default"}
                          variant={course.isActive ? "filled" : "outlined"}
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={course.isActive}
                          disabled={isToggling}
                          onChange={() => handleToggleActive(course)}
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {formatDate(course.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(course)}
                              sx={{ color: "text.secondary" }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeletingCourse(course);
                                setDeleteError(null);
                              }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* =========================================================================
          DIALOG: TẠO KHÓA HỌC MỚI
         ========================================================================= */}
      <Dialog
        open={isCreateOpen}
        onClose={() => !isCreating && setIsCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo khóa học mới</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {createError && (
              <Alert severity="error" variant="filled">
                {createError}
              </Alert>
            )}

            <TextField
              label="Tên khóa học"
              required
              fullWidth
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="Ví dụ: IELTS Master 7.5+ Chuyên Sâu"
            />

            <TextField
              label="Học phí tiêu chuẩn (VND)"
              type="number"
              required
              fullWidth
              value={createForm.tuitionFee}
              onChange={(e) =>
                setCreateForm({ ...createForm, tuitionFee: Number(e.target.value) })
              }
              slotProps={{
                input: {
                  inputProps: { min: 0, step: 50000 },
                },
              }}
            />

            <TextField
              label="Mô tả khóa học"
              multiline
              rows={3}
              fullWidth
              value={createForm.description || ""}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              placeholder="Mô tả lộ trình, mục tiêu đầu ra và đối tượng học viên phù hợp..."
            />
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
              startIcon={isCreating ? <CircularProgress size={14} color="inherit" /> : null}
            >
              {isCreating ? "Đang lưu..." : "Xác nhận tạo"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* =========================================================================
          DIALOG: CHỈNH SỬA KHÓA HỌC (HTTP PATCH)
         ========================================================================= */}
      <Dialog
        open={Boolean(editingCourse)}
        onClose={() => !isUpdating && setEditingCourse(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          Chỉnh sửa khóa học
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
            Cơ chế HTTP PATCH tự động chỉ gửi lên Backend những trường bạn thực sự thay đổi.
          </Typography>
        </DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1.5 }}>
            {editError && (
              <Alert severity="error" variant="filled">
                {editError}
              </Alert>
            )}

            <TextField
              label="Tên khóa học"
              required
              fullWidth
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />

            <TextField
              label="Học phí tiêu chuẩn (VND)"
              type="number"
              required
              fullWidth
              value={editForm.tuitionFee}
              onChange={(e) =>
                setEditForm({ ...editForm, tuitionFee: Number(e.target.value) })
              }
              slotProps={{
                input: {
                  inputProps: { min: 0, step: 50000 },
                },
              }}
            />

            <TextField
              label="Mô tả khóa học"
              multiline
              rows={3}
              fullWidth
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  color="success"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Trạng thái tuyển sinh
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Cho phép mở lớp học mới thuộc khóa học này
                  </Typography>
                </Box>
              }
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              variant="outlined"
              onClick={() => setEditingCourse(null)}
              disabled={isUpdating}
              sx={{ borderColor: "divider", color: "text.secondary" }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isUpdating}
              startIcon={isUpdating ? <CircularProgress size={14} color="inherit" /> : null}
            >
              {isUpdating ? "Đang cập nhật..." : "Lưu thay đổi (PATCH)"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* =========================================================================
          DIALOG: XÁC NHẬN XÓA KHÓA HỌC
         ========================================================================= */}
      <Dialog
        open={Boolean(deletingCourse)}
        onClose={() => !isDeleting && setDeletingCourse(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
          Xác nhận xóa khóa học
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {deleteError ? (
            <Alert severity="error">
              {deleteError}
            </Alert>
          ) : (
            <Typography variant="body2">
              Bạn có chắc chắn muốn xóa khóa học <strong>&ldquo;{deletingCourse?.title}&rdquo;</strong>?
              Thao tác này sẽ không thể khôi phục.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            onClick={() => setDeletingCourse(null)}
            disabled={isDeleting}
            sx={{ borderColor: "divider", color: "text.secondary" }}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
          </Button>
        </DialogActions>
      </Dialog>

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

export default CoursesView;
