"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/modules/auth/server";
import {
  getLatestLook,
  getLookDetails,
  getStyleMemories,
  getTodayLook,
  todayLookInputSchema,
} from "@/modules/recommendations/server";
import type { TodayLookInput, TodayLookResult } from "@/modules/recommendations/server";
import { translate } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { logger } from "@/lib/logger";

/**
 * Recommendation API — server actions used by the UI.
 *
 * The today-look action is the final error boundary for the recommendation
 * pipeline: it NEVER throws an unhandled exception to the client. AI/provider
 * failures are already recovered inside `getTodayLook` (deterministic fallback);
 * this catch covers the remaining non-AI failures (e.g. database outage) and
 * returns a structured error so the UI can render a friendly state instead of an
 * error boundary.
 */

export interface TodayLookActionResult {
  /** True only when no look (not even a fallback) could be produced. */
  error: boolean;
  /** True when the look is a deterministic fallback (AI was unavailable). */
  degraded: boolean;
  /** The resolved look, or null when `error` is true. */
  look: TodayLookResult | null;
  /** Non-technical user-facing message; set on fallback and error states. */
  message: string | null;
}

export async function getTodayLookAction(input: TodayLookInput = {}): Promise<TodayLookActionResult> {
  try {
    const userId = await getCurrentUserId();
    const locale = await getLocale();
    todayLookInputSchema.parse(input);
    const look = await getTodayLook(userId, input, locale);
    revalidatePath("/dashboard/recommendations");
    return {
      error: false,
      degraded: look.degraded ?? false,
      look,
      message: look.message ?? null,
    };
  } catch (error) {
    logger.error("today_look_action_failed", error);
    const locale = await getLocale();
    return {
      error: true,
      degraded: false,
      look: null,
      message: translate(locale, "today.errorGenerate"),
    };
  }
}

export async function getLatestLookAction() {
  const userId = await getCurrentUserId();
  const locale = await getLocale();
  return getLatestLook(userId, locale);
}

export async function getLookDetailsAction(outfitId: string) {
  const userId = await getCurrentUserId();
  const locale = await getLocale();
  return getLookDetails(userId, outfitId, locale);
}

export async function getStyleMemoriesAction() {
  const userId = await getCurrentUserId();
  return getStyleMemories(userId);
}
