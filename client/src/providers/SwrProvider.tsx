"use client";

import { SWRConfig, type SWRConfiguration } from "swr";
import { api, AppApiError } from "@/lib/axios";

interface SwrProviderProps {
  children: React.ReactNode;
}

/**
 * Global SWR (Stale-While-Revalidate) configuration
 * - Integrates with centralized Axios instance (`api.get`) as default fetcher
 * - Deduplicates requests within the interval (dedupingInterval)
 * - Prevents automatic retries on 401 Unauthorized, 403 Forbidden, and 404 Not Found errors
 */
export const swrGlobalConfig: SWRConfiguration = {
  fetcher: async (url: string) => {
    return api.get(url);
  },
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  shouldRetryOnError: (error: unknown) => {
    if (error instanceof AppApiError) {
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        return false;
      }
    }
    return true;
  },
  errorRetryCount: 3,
  errorRetryInterval: 3000,
  onError: (error: unknown, key: string) => {
    if (process.env.NODE_ENV === "development") {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown SWR error";
      // English-only developer log
      console.error(`[SWR Error] Key: "${key}" - Error: ${errorMessage}`);
    }
  },
};

export function SwrProvider({ children }: SwrProviderProps) {
  return <SWRConfig value={swrGlobalConfig}>{children}</SWRConfig>;
}

export default SwrProvider;
