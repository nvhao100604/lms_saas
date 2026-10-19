export interface TenantSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
}

export interface LoginResponse {
  userId: string;
  fullName: string;
  email: string;
  tenants: TenantSummary[];
}

export interface SelectTenantResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  tenantSlug: string;
  role: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  tenantSlug: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SelectTenantRequest {
  userId: string;
  tenantSlug: string;
}

export interface SetSessionRequest {
  userId: string;
  tenantSlug: string;
}

export interface SetSessionResponse {
  success: boolean;
  tenantSlug: string;
  role: string;
  message?: string;
}

export interface AuthApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
