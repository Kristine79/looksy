"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/modules/auth/server";
import { db } from "@/lib/db/client";
import { FeedbackService, OutfitsRepository } from "@/modules/outfits";

/**
 * Feedback Loop API — every action records a signal through FeedbackService,
 * feeding the Fashion Memory training pipeline.
 */

const itemIdSchema = z.string().uuid();

export async function loveOutfitAction(outfitId: string) {
  const userId = await getCurrentUserId();
  itemIdSchema.parse(outfitId);
  await new FeedbackService(new OutfitsRepository(db)).recordSave(userId, { outfitId });
  revalidatePath("/dashboard/recommendations");
  return { ok: true };
}

export async function woreOutfitAction(outfitId: string, itemIds: string[]) {
  const userId = await getCurrentUserId();
  itemIdSchema.parse(outfitId);
  const parsedIds = z.array(itemIdSchema).min(1).max(12).parse(itemIds);
  await new FeedbackService(new OutfitsRepository(db)).recordWear(userId, {
    outfitId,
    itemIds: parsedIds,
    source: "recommendation",
  });
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
  await new FeedbackService(new OutfitsRepository(db)).recordSwap(userId, {
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
  await new FeedbackService(new OutfitsRepository(db)).recordSkip(userId, { outfitId });
  revalidatePath("/dashboard/recommendations");
  return { ok: true };
}
