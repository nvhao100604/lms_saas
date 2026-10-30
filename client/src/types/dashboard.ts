export interface TodaySessionItemResponse {
  sessionId: string;
  classId: string;
  className: string;
  courseTitle: string;
  teacherName: string;
  roomName: string | null;
  sessionNumber: number;
  topic: string | null;
  startTime: string;
  endTime: string;
}

export interface SubscriptionQuotaResponse {
  planName: string;
  monthlyPrice: number;
  currentClassesCount: number;
  maxClassesLimit: number;
  currentStudentsCount: number;
  maxStudentsLimit: number;
}

export interface DashboardSummaryResponse {
  totalActiveCourses: number;
  totalOngoingClasses: number;
  totalActiveTeachers: number;
  totalActiveStudents: number;
  attendanceRatePercent: number;
  quota: SubscriptionQuotaResponse;
  todaySessions: TodaySessionItemResponse[];
}

export interface SubscriptionPlanItemResponse {
  id: string;
  name: string;
  monthlyPrice: number;
  maxClassesLimit: number;
  maxStudentsLimit: number;
  isCurrentPlan: boolean;
}

export interface ChangeSubscriptionPlanRequest {
  planId: string;
}
