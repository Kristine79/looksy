import { MemoriesRepository } from "./repository";
import type { UserStyleContext } from "./types";

export interface ContextOptions {
  wardrobeLimit?: number;
  outfitsLimit?: number;
  wearLimit?: number;
  feedbackLimit?: number;
  memoriesLimit?: number;
}

/**
 * Recommendation Context Service — prepares retrieval-ready context
 * for the future AI pipeline. No LLM calls, pure data assembly.
 *
 * Phase 7: memories are filtered to exclude `deleted` (user-rejected) so the
 * prompt never receives preferences the user has explicitly dismissed. Auto-
 * generated memories with `fading` / `dormant` status are still included —
 * their low confidence already reflects staleness; excluding them entirely
 * would silently drop long-standing preferences on a single quiet period.
 */
export class RecommendationContextService {
  constructor(private readonly repository: MemoriesRepository) {}

  async buildUserStyleContext(userId: string, options: ContextOptions = {}): Promise<UserStyleContext> {
    const [wardrobe, recentOutfits, wearHistory, feedback, memories, styleProfile] = await Promise.all([
      this.repository.findItems(userId, options.wardrobeLimit ?? 50),
      this.repository.findOutfits(userId, options.outfitsLimit ?? 10),
      this.repository.findWearHistory(userId, options.wearLimit ?? 20),
      this.repository.findUserFeedback(userId, options.feedbackLimit ?? 20),
      this.repository.findActiveMemories(userId, options.memoriesLimit ?? 20),
      this.repository.findStyleProfile(userId),
    ]);

    return {
      userId,
      wardrobe,
      recentOutfits,
      wearHistory,
      feedback,
      memories,
      styleProfile,
    };
  }
}
