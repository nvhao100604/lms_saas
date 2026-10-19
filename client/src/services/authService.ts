import { api, axiosClient } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import type {
  LoginRequest,
  LoginResponse,
  SetSessionRequest,
  SetSessionResponse,
  AuthApiResponse,
  RefreshTokenResponse,
} from "@/types/auth";

/**
 * Service Layer chuyên biệt cho xác thực và quản lý phiên phía Client
 * Sử dụng Axios Client Instance chuẩn hóa (với credentials, base URL và error handling)
 */
export const authService = {
  /**
   * Gọi API đăng nhập sơ bộ (Proxy qua Next.js Route Handler tới .NET BFF)
   */
  login: async (payload: LoginRequest): Promise<AuthApiResponse<LoginResponse>> => {
    return api.post<AuthApiResponse<LoginResponse>>(ROUTES.API.AUTH.LOGIN_PROXY, payload);
  },

  /**
   * Chọn trung tâm và thiết lập HttpOnly Cookies trên Server
   */
  setSession: async (payload: SetSessionRequest): Promise<SetSessionResponse> => {
    return api.post<SetSessionResponse>(ROUTES.API.AUTH.SET_SESSION, payload);
  },

  /**
   * Làm mới phiên làm việc (Silent Refresh)
   */
  refresh: async (): Promise<AuthApiResponse<RefreshTokenResponse>> => {
    const response = await axiosClient.post<AuthApiResponse<RefreshTokenResponse>>(
      ROUTES.API.AUTH.REFRESH
    );
    return response.data;
  },

  /**
   * Đăng xuất và thu hồi Refresh Token
   */
  logout: async (): Promise<AuthApiResponse<{ success: boolean }>> => {
    return api.post<AuthApiResponse<{ success: boolean }>>(ROUTES.API.AUTH.LOGOUT);
  },
};
