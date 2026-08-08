"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/modules/auth/server";
import { loadDemoContent } from "./service";

/**
 * Onboarding action: loads the demo wardrobe into the current user's account.
 * Idempotent — safe to call repeatedly; existing data is never overwritten.
 */
export async function loadDemoWardrobeAction() {
  const userId = await getCurrentUserId();
  const result = await loadDemoContent(userId);
  revalidatePath("/dashboard/wardrobe");
  revalidatePath("/dashboard/recommendations");
  return result;
}
