export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
  },
  TENANT: {
    ROOT: (tenantSlug: string) => `/${tenantSlug}`,
    DASHBOARD: (tenantSlug: string) => `/${tenantSlug}/dashboard`,
    COURSES: (tenantSlug: string) => `/${tenantSlug}/courses`,
    CLASSES: (tenantSlug: string) => `/${tenantSlug}/classes`,
    SCHEDULE: (tenantSlug: string) => `/${tenantSlug}/schedule`,
    ATTENDANCE: (tenantSlug: string) => `/${tenantSlug}/attendance`,
    MEMBERS: (tenantSlug: string) => `/${tenantSlug}/members`,
  },
  DASHBOARD: {
    OVERVIEW: "/dashboard",
    COURSES: "/dashboard/courses",
    STUDENTS: "/dashboard/students",
    ANALYTICS: "/dashboard/analytics",
    SETTINGS: "/dashboard/settings",
  },
  LEARNING: {
    EXPLORE: "/courses",
    DETAIL: (slug: string) => `/courses/${slug}`,
    LESSON: (courseSlug: string, lessonId: string) =>
      `/courses/${courseSlug}/lessons/${lessonId}`,
  },
  API: {
    AUTH: {
      LOGIN_PROXY: "/api/auth/login-proxy",
      SET_SESSION: "/api/auth/set-session",
      REFRESH: "/api/auth/refresh",
      LOGOUT: "/api/auth/logout",
    },
    COURSES: {
      ROOT: "/api/courses",
      DETAIL: (id: string) => `/api/courses/${id}`,
    },
    CLASSES: {
      ROOT: "/api/classes",
      DETAIL: (id: string) => `/api/classes/${id}`,
      ENROLLMENTS: (classId: string) => `/api/classes/${classId}/enrollments`,
      REMOVE_ENROLLMENT: (classId: string, studentId: string) =>
        `/api/classes/${classId}/enrollments/${studentId}`,
    },
    MEMBERS: {
      ROOT: "/api/members",
      DETAIL: (id: string) => `/api/members/${id}`,
      TEACHERS: "/api/members/teachers",
      STUDENTS: "/api/members/students",
    },
    SCHEDULE: {
      ROOT: "/api/schedule",
    },
    SESSIONS: {
      ATTENDANCES: (sessionId: string) => `/api/sessions/${sessionId}/attendances`,
    },
    NOTIFICATIONS: {
      ROOT: "/api/notifications",
      MARK_READ: (id: string) => `/api/notifications/${id}/read`,
      MARK_ALL_READ: "/api/notifications/read-all",
    },
    DASHBOARD: {
      ROOT: "/api/dashboard",
    },
  },
} as const;
