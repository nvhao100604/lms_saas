export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
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
} as const;
