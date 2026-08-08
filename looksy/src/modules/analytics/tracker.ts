import { db } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import { AnalyticsRepository } from "./repository";

/**
 * Internal product analytics — a thin event abstraction over the
 * `analytics_events` table. No external platform, no third-party SDK.
 *
 * Events are best-effort: tracking must NEVER break the user-facing flow.
 * Every failure is swallowed and logged so the feature is safe to call from
 * hot paths (feedback, analysis, generation).
 */
export const ANALYTICS_EVENTS = {
  USER_CREATED: "user_created",
  ITEM_ADDED: "item_added",
  AI_ANALYSIS_COMPLETED: "ai_analysis_completed",
  AI_ANALYSIS_FAILED: "ai_analysis_failed",
  OUTFIT_GENERATED: "outfit_generated",
  OUTFIT_SAVED: "outfit_saved",
  OUTFIT_WORN: "outfit_worn",
  OUTFIT_SKIPPED: "outfit_skipped",
  MEMORY_CREATED: "memory_created",
  MEMORY_CONFIRMED: "memory_confirmed",
  DEMO_CONTENT_LOADED: "demo_content_loaded",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export async function trackEvent(
  userId: string | null,
  eventName: AnalyticsEventName | string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    const repository = new AnalyticsRepository(db);
    await repository.insertEvent(userId, eventName, properties);
  } catch (error) {
    logger.warn("analytics_track_failed", {
      eventName,
      error: error instanceof Error ? error.message : "unknown error",
    });
  }
}

/**
 * Fire-and-forget variant for hot paths. `trackEvent` never throws, so the
 * floating promise is safe and analytics adds zero latency to the flow.
 */
export function emitEvent(
  userId: string | null,
  eventName: AnalyticsEventName | string,
  properties: Record<string, unknown> = {}
): void {
  void trackEvent(userId, eventName, properties);
}
