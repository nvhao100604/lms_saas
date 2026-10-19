import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES, ENV_CONFIG } from "@/constants/config";

export class BffError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "BffError";
  }
}

/**
 * Axios instance chuyên biệt cho tầng Server (Next.js Route Handlers & Server Actions)
 * Giao tiếp trực tiếp với Backend .NET BFF
 */
export const bffClient: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG.DOTNET_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Chuẩn hóa lỗi từ Backend .NET BFF thành NextResponse JSON cho các API Route
 */
export function handleBffError(error: unknown): NextResponse {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 502;
    const responseData = error.response?.data;

    if (responseData && typeof responseData === "object") {
      return NextResponse.json(responseData, { status });
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Request to backend failed.",
      },
      { status }
    );
  }

  const message =
    error instanceof Error
      ? error.message
      : "Failed to communicate with authentication server.";

  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 502 }
  );
}

export interface BffRequestOptions extends AxiosRequestConfig {
  tenantSlug?: string;
}

/**
 * Tiện ích gọi API sang .NET BFF Backend từ Server Components và Server Actions
 * Tự động gắn Access Token từ HttpOnly Cookie và Header X-Tenant-Slug khi có
 */
export async function fetchFromBff<T>(
  endpoint: string,
  options: BffRequestOptions = {}
): Promise<T> {
  const { tenantSlug, headers: customHeaders, ...restConfig } = options;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  try {
    const response = await bffClient.get<T>(endpoint, {
      headers,
      ...restConfig,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ||
        `Request to .NET BFF failed with status code ${status}.`;
      throw new BffError(status, message, error.response?.data);
    }
    throw error;
  }
}
