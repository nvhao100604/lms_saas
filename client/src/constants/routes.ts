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
  },
} as const;
