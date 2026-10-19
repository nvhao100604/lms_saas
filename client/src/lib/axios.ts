import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { ENV_CONFIG } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import type { AuthApiResponse, RefreshTokenResponse } from "@/types/auth";

/**
 * Lớp lỗi chuẩn hóa trả về cho các layer phía trên (UI / Services / SWR)
 */
export class AppApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "AppApiError";
    this.status = status;
    this.data = data;
  }
}

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Axios instance chuẩn cho toàn bộ ứng dụng Client
 * - withCredentials: true tự động đính kèm HttpOnly Cookie
 * - baseURL lấy từ ENV_CONFIG.PUBLIC_API_URL
 */
export const axiosClient: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG.PUBLIC_API_URL || undefined,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Tự động trích xuất và gắn Tenant Header nếu có trên Client
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const segments = pathname.split("/").filter(Boolean);
      const possibleTenantSlug = segments[0];

      const isSystemRoute =
        possibleTenantSlug === "login" ||
        possibleTenantSlug === "register" ||
        possibleTenantSlug === "api";

      if (
        possibleTenantSlug &&
        !isSystemRoute &&
        !config.headers["X-Tenant-Slug"]
      ) {
        config.headers["X-Tenant-Slug"] = possibleTenantSlug;
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response Interceptor: Tự động bắt lỗi 401, xoay vòng Silent Refresh Token và chuẩn hóa cấu trúc lỗi
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;

    // 1. Bắt lỗi 401 Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      // Bỏ qua nếu chính request gọi refresh hoặc login bị lỗi để tránh lặp vô hạn
      const isAuthEndpoint =
        originalRequest.url?.includes(ROUTES.API.AUTH.REFRESH) ||
        originalRequest.url?.includes(ROUTES.AUTH.LOGIN);

      if (isAuthEndpoint || originalRequest._retry) {
        return handleAuthFailure(error);
      }

      // Nếu đang có tiến trình refresh token chạy ngầm, xếp request vào hàng đợi
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(originalRequest))
          .catch((err: unknown) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi tới Next.js Route Handler /api/auth/refresh (BFF Pattern)
        const refreshResponse = await fetch(ROUTES.API.AUTH.REFRESH, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh session.");
        }

        const refreshData: AuthApiResponse<RefreshTokenResponse> =
          await refreshResponse.json();

        if (!refreshData.success) {
          throw new Error(refreshData.message || "Failed to refresh session.");
        }

        // Xoay vòng token thành công -> Giải phóng toàn bộ hàng đợi và thực thi lại request ban đầu
        processQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return handleAuthFailure(error);
      } finally {
        isRefreshing = false;
      }
    }

    // 2. Chuẩn hóa lỗi cho tất cả các mã lỗi còn lại
    return normalizeError(error);
  }
);

/**
 * Xử lý khi xác thực thất bại: chuyển hướng người dùng về trang đăng nhập
 */
function handleAuthFailure(error: AxiosError): Promise<never> {
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    const loginUrl = `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }
  return normalizeError(error);
}

/**
 * Chuẩn hóa lỗi AxiosError thành AppApiError { status, message, data }
 */
function normalizeError(error: AxiosError): Promise<never> {
  const status = error.response?.status || 500;
  const responseData = error.response?.data as
    | { message?: string; error?: string }
    | undefined;

  const message =
    responseData?.message ||
    responseData?.error ||
    error.message ||
    "An unexpected error occurred while communicating with the server.";

  return Promise.reject(new AppApiError(status, message, error.response?.data));
}

/**
 * Tiện ích gọi API trả về trực tiếp response data unwrapped
 */
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosClient.get<T>(url, config);
    return response.data;
  },
  post: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosClient.post<T>(url, data, config);
    return response.data;
  },
  put: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosClient.put<T>(url, data, config);
    return response.data;
  },
  patch: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosClient.patch<T>(url, data, config);
    return response.data;
  },
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosClient.delete<T>(url, config);
    return response.data;
  },
};

export default axiosClient;
