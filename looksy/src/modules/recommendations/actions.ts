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
import type { TodayLookInput } from "@/modules/recommendations/server";

/**
 * Recommendation API — server actions used by the UI.
 */

export async function getTodayLookAction(input: TodayLookInput = {}) {
  const userId = await getCurrentUserId();
  todayLookInputSchema.parse(input);
  const look = await getTodayLook(userId, input);
  revalidatePath("/dashboard/recommendations");
  return look;
}

export async function getLatestLookAction() {
  const userId = await getCurrentUserId();
  return getLatestLook(userId);
}

export async function getLookDetailsAction(outfitId: string) {
  const userId = await getCurrentUserId();
  return getLookDetails(userId, outfitId);
}

export async function getStyleMemoriesAction() {
  const userId = await getCurrentUserId();
  return getStyleMemories(userId);
}
