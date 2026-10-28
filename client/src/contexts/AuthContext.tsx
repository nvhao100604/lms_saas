"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAppSelector } from "@/store/hooks";

export type UserRole = "CenterAdmin" | "Teacher" | "Student" | string;

export interface CurrentUser {
  userId?: string;
  email?: string;
  fullName?: string;
  role: UserRole;
  tenantSlug?: string;
}

export interface AuthContextValue {
  user: CurrentUser | null;
  role: UserRole;
  isCenterAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  roleDisplayName: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  currentUser?: CurrentUser | null;
  tenantSlug: string;
  children: React.ReactNode;
}

export function AuthProvider({
  currentUser: initialUser,
  tenantSlug,
  children,
}: AuthProviderProps) {
  const t = useAppSelector((state) => state.language.t);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(
    initialUser ?? null
  );

  React.useEffect(() => {
    if (!initialUser) {
      let isMounted = true;
      // Fallback: Fetch user info from /api/auth/me if not passed via Server Component
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && data?.data) {
            setCurrentUser({
              ...data.data,
              tenantSlug,
            });
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [initialUser, tenantSlug]);

  const value = useMemo<AuthContextValue>(() => {
    const rawRole = currentUser?.role || "Student";
    const normalized = rawRole.toLowerCase();

    const isCenterAdmin =
      normalized === "centeradmin" || normalized === "admin";
    const isTeacher =
      normalized === "teacher" || normalized === "instructor";
    const isStudent = !isCenterAdmin && !isTeacher;

    const roleDisplayName = isCenterAdmin
      ? t.roles.admin
      : isTeacher
      ? t.roles.instructor
      : t.roles.student;

    return {
      user: currentUser ?? null,
      role: rawRole,
      isCenterAdmin,
      isTeacher,
      isStudent,
      roleDisplayName,
    };
  }, [currentUser, t.roles.admin, t.roles.instructor, t.roles.student]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      role: "Student",
      isCenterAdmin: false,
      isTeacher: false,
      isStudent: true,
      roleDisplayName: "Học viên",
    };
  }
  return context;
}

export function useCurrentRole() {
  const auth = useAuth();
  return {
    role: auth.role,
    isCenterAdmin: auth.isCenterAdmin,
    isTeacher: auth.isTeacher,
    isStudent: auth.isStudent,
    roleDisplayName: auth.roleDisplayName,
    user: auth.user,
  };
}
