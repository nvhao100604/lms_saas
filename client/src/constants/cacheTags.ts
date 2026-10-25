/**
 * Centralized Cache Tags Registry for Next.js Cache Components and Data Caching.
 * Ensures consistent tag naming conventions across server components, actions, and invalidations.
 */
export const CACHE_TAGS = {
  /**
   * Root tag for all tenant-specific cached data
   */
  tenant: (tenantSlug: string) => `tenant:${tenantSlug}`,

  /**
   * Tag for course catalog and course list queries
   */
  courses: (tenantSlug: string) => `tenant:${tenantSlug}:courses`,

  /**
   * Tag for a specific course by ID
   */
  courseDetail: (tenantSlug: string, courseId: string | number) =>
    `tenant:${tenantSlug}:courses:${courseId}`,

  /**
   * Tag for tenant dashboard overview statistics and KPI metrics
   */
  dashboard: (tenantSlug: string) => `tenant:${tenantSlug}:dashboard`,

  /**
   * Tag for class schedules and class listings
   */
  classes: (tenantSlug: string) => `tenant:${tenantSlug}:classes`,

  /**
   * Tag for tenant branding, settings, and static configurations
   */
  settings: (tenantSlug: string) => `tenant:${tenantSlug}:settings`,
} as const;
