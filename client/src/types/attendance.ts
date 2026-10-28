export type AttendanceStatusType = "Present" | "Absent" | "Late" | "Excused";

export interface StudentAttendanceRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: AttendanceStatusType | "NotRecorded";
  note: string | null;
  isRecorded: boolean;
}

export interface SessionAttendanceSheet {
  sessionId: string;
  classId: string;
  className: string;
  courseTitle: string;
  teacherName: string;
  sessionNumber: number;
  topic: string | null;
  startTime: string;
  endTime: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  students: StudentAttendanceRow[];
}

export interface AttendanceItemPayload {
  studentId: string;
  status: number; // 1: Present, 2: Absent, 3: Late, 4: Excused
  note?: string;
}

export interface SaveSessionAttendancePayload {
  topic?: string;
  attendances: AttendanceItemPayload[];
}

export interface ClassEnrollment {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
}

export interface TenantStudent {
  userId: string;
  fullName: string;
  email: string;
}
