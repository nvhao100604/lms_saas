export interface ScheduleSession {
  sessionId: string;
  classId: string;
  className: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  roomName: string | null;
  sessionNumber: number;
  topic: string | null;
  startTime: string;
  endTime: string;
  classStatus: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  myAttendanceStatus: "Present" | "Absent" | "Late" | "Excused" | null;
}

export interface ScheduleFilterParams {
  from?: string;
  to?: string;
  classId?: string;
  teacherId?: string;
}
