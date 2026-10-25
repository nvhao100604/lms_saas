export type DayOfWeekName =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type ClassStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";

export interface ClassSessionResponse {
  id: string;
  sessionNumber: number;
  topic: string | null;
  startTime: string;
  endTime: string;
}

export interface ClassResponse {
  id: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  name: string;
  roomName: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  maxCapacity: number;
  status: ClassStatus;
  totalSessions: number;
  sessions?: ClassSessionResponse[] | null;
}

export interface ClassScheduleConfigRequest {
  daysOfWeek: (number | DayOfWeekName)[]; // 0 (Sunday) -> 6 (Saturday)
  startTime: string; // "HH:mm:ss" hoặc "HH:mm"
  endTime: string; // "HH:mm:ss" hoặc "HH:mm"
}

export interface CreateClassRequest {
  courseId: string;
  teacherId: string;
  name: string;
  roomName?: string | null;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  schedule: ClassScheduleConfigRequest;
}

export interface TenantTeacherResponse {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

// Tận dụng Partial & Pick cho HTTP PATCH khớp với Backend ToPatchDictionary
export type PatchClassRequest = Partial<
  Pick<CreateClassRequest, "name" | "roomName" | "maxCapacity">
> & {
  status?: ClassStatus;
};
