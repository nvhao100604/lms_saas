import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type {
  SessionAttendanceSheet,
  SaveSessionAttendancePayload,
} from "@/types/attendance";

/**
 * Service Layer cho Sổ Điểm danh Buổi học
 */
export const attendanceService = {
  /**
   * Lấy chi tiết sổ điểm danh và số liệu chuyên cần của buổi học
   */
  getSessionAttendance: async (
    sessionId: string
  ): Promise<SessionAttendanceSheet> => {
    const res = await api.get<ApiResponse<SessionAttendanceSheet>>(
      ROUTES.API.SESSIONS.ATTENDANCES(sessionId)
    );
    return res.data!;
  },

  /**
   * Lưu sổ điểm danh theo lô (Batch Upsert) bọc trong Transaction
   */
  saveAttendance: async (
    sessionId: string,
    payload: SaveSessionAttendancePayload
  ): Promise<boolean> => {
    const res = await api.put<ApiResponse<boolean>>(
      ROUTES.API.SESSIONS.ATTENDANCES(sessionId),
      payload
    );
    return res.data ?? true;
  },
};

export default attendanceService;
