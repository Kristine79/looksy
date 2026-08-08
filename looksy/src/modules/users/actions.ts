"use server";

import { getCurrentUserId } from "@/modules/auth/server";
import { db } from "@/lib/db/client";
import { UsersRepository, UsersService } from "@/modules/users";

/**
 * Marks the first-time onboarding as completed for the current user.
 * Used by the welcome banner on the dashboard.
 */
export async function completeOnboardingAction() {
  const userId = await getCurrentUserId();
  await new UsersService(new UsersRepository(db)).updatePreferences(userId, {
    quizCompleted: true,
  });
  return { ok: true };
}
