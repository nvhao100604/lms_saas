export type RoleInTenant = "CenterAdmin" | "Teacher" | "Student";

export interface TenantMemberResponse {
  memberId: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

export interface CreateTenantMemberRequest {
  fullName: string;
  email: string;
  role: RoleInTenant;
  initialPassword?: string;
}

export type PatchTenantMemberRequest = Partial<
  Pick<CreateTenantMemberRequest, "fullName" | "role">
> & {
  isActive?: boolean;
};

export interface MemberFilterParams {
  role?: string;
  search?: string;
}

