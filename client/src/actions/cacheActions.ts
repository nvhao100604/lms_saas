"use server";

import { updateTag, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/constants/cacheTags";

export interface RevalidationResult {
  success: boolean;
  tag: string;
  revalidatedAt: string;
}

/**
 * Purges and revalidates cached course catalog for a specific tenant.
 * Uses `updateTag` for immediate cache expiration in Server Actions.
 */
export async function revalidateCoursesAction(
  tenantSlug: string
): Promise<RevalidationResult> {
  const tag = CACHE_TAGS.courses(tenantSlug);
  updateTag(tag);

  return {
    success: true,
    tag,
    revalidatedAt: new Date().toISOString(),
  };
}

/**
 * Purges and revalidates cached dashboard metrics for a specific tenant.
 */
export async function revalidateDashboardAction(
  tenantSlug: string
): Promise<RevalidationResult> {
  const tag = CACHE_TAGS.dashboard(tenantSlug);
  updateTag(tag);

  return {
    success: true,
    tag,
    revalidatedAt: new Date().toISOString(),
  };
}

/**
 * Generic server action to revalidate an arbitrary cache tag.
 * Supports immediate updateTag or scheduled revalidateTag with a cacheLife profile.
 */
export async function revalidateTagAction(
  tag: string,
  profile?: string
): Promise<RevalidationResult> {
  if (profile) {
    revalidateTag(tag, profile);
  } else {
    updateTag(tag);
  }

  return {
    success: true,
    tag,
    revalidatedAt: new Date().toISOString(),
  };
}
