export type SupportedLanguage = "vi" | "en";

export interface CommonTranslations {
  appName: string;
  tagline: string;
  language: string;
  vietnamese: string;
  english: string;
  switchWorkspace: string;
  securityBadge: string;
  securityDesc: string;
  backToLogin: string;
  active: string;
  protected: string;
  loading: string;
  footerSecurityBadge: string;
  switchLanguageAria: string;
  closeErrorAria: string;
  showPasswordAria: string;
  hidePasswordAria: string;
  logoAlt: string;
}

export interface AuthValidationTranslations {
  emailRequired: string;
  emailInvalid: string;
  passwordMin: string;
  passwordMax: string;
  fullNameMin: string;
  fullNameMax: string;
  confirmPasswordRequired: string;
  passwordsDoNotMatch: string;
}

export interface AuthTranslations {
  signInTitle: string;
  signInSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  submitButton: string;
  submitting: string;
  initializingWorkspace: string;
  connectingToTenant: string;
  selectTenantTitle: string;
  selectTenantWelcome: string;
  selectTenantInstruction: string;
  switchAccount: string;
  emptyTenantsError: string;
  invalidCredentialsError: string;
  sessionError: string;
  networkError: string;
  validation: AuthValidationTranslations;
}

export interface RoleTranslations {
  admin: string;
  instructor: string;
  student: string;
}

export interface DashboardTranslations {
  currentSpaceBadge: string;
  welcomePrefix: string;
  workingInSpace: string;
  bffSecurityDesc: string;
  createNewCourse: string;
  inviteStudents: string;
  statsTotalCourses: string;
  statsTotalCoursesSub: string;
  statsThisMonth: string;
  statsActiveStudents: string;
  statsActiveStudentsSub: string;
  statsGrowth: string;
  statsInstructors: string;
  statsInstructorsSub: string;
  statsOnline: string;
  statsCompletionRate: string;
  statsCompletionRateSub: string;
  statsThisWeek: string;
  sessionHttpOnlyPrefix: string;
  sessionActive: string;
  sessionProtected: string;
}

export interface CoursesTranslations {
  searchPlaceholder: string;
  clearSearch: string;
  refreshSwr: string;
  updating: string;
  loadingFailed: string;
  defaultErrorMessage: string;
  tryAgain: string;
  courseFee: string;
  viewDetails: string;
  totalCoursesPrefix: string;
  coursesCountSuffix: string;
  pagePrefix: string;
  previousPage: string;
  nextPage: string;
  noCoursesFound: string;
}

export interface HomeTranslations {
  pageTitle: string;
  gettingStarted: string;
  editInstruction: string;
  exploreInstructions: string;
  templates: string;
  learningCenter: string;
  orThe: string;
  loginButton: string;
  documentation: string;
}

export interface NavigationTranslations {
  dashboard: string;
  courses: string;
  classes: string;
  schedule: string;
  attendance: string;
  workspaceBadge: string;
  switchWorkspace: string;
  logout: string;
  loggingOut: string;
  collapseSidebar: string;
  expandSidebar: string;
  toggleMobileMenu: string;
  closeMobileMenu: string;
  currentWorkspace: string;
  userMenu: string;
}

export interface SectionsTranslations {
  classesDesc: string;
  scheduleDesc: string;
  attendanceDesc: string;
  moduleSuffix: string;
  workspaceSubtitle: string;
  integratedDesc: string;
  loadingClasses: string;
  loadingSchedule: string;
  loadingAttendance: string;
  loadingCourses: string;
}

export interface Translations {
  common: CommonTranslations;
  auth: AuthTranslations;
  roles: RoleTranslations;
  dashboard: DashboardTranslations;
  courses: CoursesTranslations;
  home: HomeTranslations;
  navigation: NavigationTranslations;
  sections: SectionsTranslations;
}
