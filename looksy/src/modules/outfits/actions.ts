"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/modules/auth/server";
import { db } from "@/lib/db/client";
import { FeedbackService, OutfitsRepository } from "@/modules/outfits";
import { createMemoryAutomationHook } from "@/modules/recommendations/server";
import { ANALYTICS_EVENTS, emitEvent } from "@/modules/analytics";
import type { MemoryAutomationHook } from "@/modules/outfits/feedbackService";

/**
 * Feedback Loop API — every action records a signal through FeedbackService,
 * feeding the Fashion Memory training pipeline (Phase 7). The automation hook
 * turns wear/save/skip/swap events into evidence-backed memories.
 *
 * The hook is built lazily on first use so importing this module in a context
 * without the recommendations import resolution cost set up (e.g. unit tests
 * that mock the whole module) never triggers a heavy construction at import.
 */

const itemIdSchema = z.string().uuid();

let memoryHook: MemoryAutomationHook | null = null;
function getMemoryHook(): MemoryAutomationHook {
  if (!memoryHook) memoryHook = createMemoryAutomationHook();
  return memoryHook;
}

function feedbackService() {
  return new FeedbackService(new OutfitsRepository(db), getMemoryHook());
}

export async function loveOutfitAction(outfitId: string) {
  const userId = await getCurrentUserId();
  itemIdSchema.parse(outfitId);
  await feedbackService().recordSave(userId, { outfitId });
  emitEvent(userId, ANALYTICS_EVENTS.OUTFIT_SAVED, { outfitId });
  revalidatePath("/dashboard/recommendations");
  return { ok: true };
}

export async function woreOutfitAction(outfitId: string, itemIds: string[]) {
  const userId = await getCurrentUserId();
  itemIdSchema.parse(outfitId);
  const parsedIds = z.array(itemIdSchema).min(1).max(12).parse(itemIds);
  await feedbackService().recordWear(userId, {
    outfitId,
    itemIds: parsedIds,
    source: "recommendation",
  });
  emitEvent(userId, ANALYTICS_EVENTS.OUTFIT_WORN, { outfitId, itemCount: parsedIds.length });
  revalidatePath("/dashboard/recommendations");
  return { ok: true };
}

export async function changeItemAction(
  outfitId: string,
  swapOutItemId: string,
  swapInItemId: string | null
) {
  const userId = await getCurrentUserId();
  itemIdSchema.parse(outfitId);
  itemIdSchema.parse(swapOutItemId);
  const parsedSwapIn = swapInItemId ? itemIdSchema.parse(swapInItemId) : null;
  await feedbackService().recordSwap(userId, {
    outfitId,
    swapOutItemId,
    swapInItemId: parsedSwapIn,
  });
  revalidatePath("/dashboard/recommendations");
  return { ok: true };
}

export async function notForMeAction(outfitId: string) {
  const userId = await getCurrentUserId();
  itemIdSchema.parse(outfitId);
  await feedbackService().recordSkip(userId, { outfitId });
  emitEvent(userId, ANALYTICS_EVENTS.OUTFIT_SKIPPED, { outfitId });
  revalidatePath("/dashboard/recommendations");
  return { ok: true };
}
