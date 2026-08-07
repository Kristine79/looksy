"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/modules/auth/server";
import { db } from "@/lib/db/client";
import { ClosetRepository, ClosetService } from "@/modules/closet";
import {
  addClothingItemWithAnalysis,
  getWardrobeForPage,
  reprocessClothingAnalysis,
  addToWardrobeInputSchema,
} from "@/modules/closet/server";
import type { AddToWardrobeInput } from "@/modules/closet/server";

/**
 * Wardrobe API — server actions used by the UI.
 * All business logic lives in services; these are thin accessors.
 */

export async function getWardrobeAction(query: { type?: string; status?: string } = {}) {
  const userId = await getCurrentUserId();
  return getWardrobeForPage(userId, query);
}

export async function addToWardrobeAction(input: AddToWardrobeInput) {
  const userId = await getCurrentUserId();
  addToWardrobeInputSchema.parse(input);
  const result = await addClothingItemWithAnalysis(userId, input);
  revalidatePath("/dashboard/wardrobe");
  revalidatePath("/dashboard/recommendations");
  return result;
}

export async function reprocessItemAction(itemId: string) {
  const userId = await getCurrentUserId();
  const outcome = await reprocessClothingAnalysis(userId, itemId);
  revalidatePath("/dashboard/wardrobe");
  return outcome;
}

export async function retryItemFormAction(itemId: string): Promise<void> {
  await reprocessItemAction(itemId);
}

export async function archiveItemFormAction(itemId: string): Promise<void> {
  await removeItemAction(itemId);
}

export async function removeItemAction(itemId: string) {
  const userId = await getCurrentUserId();
  await new ClosetService(new ClosetRepository(db)).removeFromWardrobe(userId, itemId);
  revalidatePath("/dashboard/wardrobe");
  return { ok: true };
}
