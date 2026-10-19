/**
 * Cấu hình tập trung cho toàn bộ ứng dụng Client
 * Đọc từ biến môi trường (Environment Variables) hoặc giá trị mặc định chuẩn
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

export const ENV_CONFIG = {
  /**
   * URL của .NET BFF Backend (dùng trong Server Components, Server Actions, Route Handlers và Edge Middleware)
   */
  DOTNET_API_URL: process.env.DOTNET_API_URL || "http://localhost:5045",

  /**
   * URL API công khai (Client-side / Browser)
   * Mặc định là chuỗi rỗng ("") để Axios gọi relative URL (/api/...) tới Next.js Route Handlers (Same-Origin BFF)
   */
  PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",

  /**
   * Tên ứng dụng hiển thị
   */
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "LMS SaaS",

  /**
   * Slug của trung tâm mặc định
   */
  DEFAULT_TENANT_SLUG:
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "apex-english",
} as const;
