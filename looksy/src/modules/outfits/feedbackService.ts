import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { OutfitsRepository } from "./repository";
import type { RecordFeedbackInput, RecordSwapInput, RecordWearInput } from "./types";

/**
 * Optional memory hook. FeedbackService stays decoupled from the recommendations
 * module at the type level — the hook is a function-shaped dependency so the
 * recommendation pipeline can opt in without FeedbackService importing it
 * directly (avoids a circular module dependency: recommendations → outfits via
 * the action/UI layer, outfits → recommendations would close the loop).
 *
 * Phase 7 wires this hook to `MemoryAutomationService.processSignals` from the
 * server-side composition root. Callers that don't pass a hook (existing tests,
 * the manual FashionMemoryService path) keep working unchanged.
 */
export type MemoryAutomationHook = (userId: string) => Promise<void>;

export class FeedbackService {
  constructor(
    private readonly repository: OutfitsRepository,
    private readonly onMemorySignal?: MemoryAutomationHook,
  ) {}

  async recordWear(userId: string, input: RecordWearInput) {
    if (input.itemIds.length === 0) {
      throw new ValidationError("recordWear requires at least one itemId");
    }

    if (input.outfitId) {
      await this.verifyOutfitOwnership(userId, input.outfitId);
    }

    const wearLogRow = await this.repository.insertWearLog(userId, input);
    await this.repository.bumpItemWearCounters(input.itemIds, input.wornAt ?? new Date());
    await this.triggerMemoryAutomation(userId);
    return wearLogRow;
  }

  async recordSave(userId: string, input: RecordFeedbackInput) {
    if (input.outfitId) {
      await this.verifyOutfitOwnership(userId, input.outfitId);
    }
    const feedback = await this.repository.insertFeedback(userId, input, "save");
    if (input.outfitId) {
      await this.repository.updateOutfitStatus(input.outfitId, "saved");
    }
    await this.triggerMemoryAutomation(userId);
    return feedback;
  }

  async recordSwap(userId: string, input: RecordSwapInput) {
    if (input.outfitId) {
      await this.verifyOutfitOwnership(userId, input.outfitId);
    }
    const feedback = await this.repository.insertFeedback(userId, input, "swap");
    await this.triggerMemoryAutomation(userId);
    return feedback;
  }

  async recordSkip(userId: string, input: RecordFeedbackInput) {
    if (input.outfitId) {
      await this.verifyOutfitOwnership(userId, input.outfitId);
    }
    const feedback = await this.repository.insertFeedback(userId, input, "skip");
    if (input.outfitId) {
      await this.repository.updateOutfitStatus(input.outfitId, "dismissed");
    }
    await this.triggerMemoryAutomation(userId);
    return feedback;
  }

  /**
   * Invokes the memory-automation hook if one was injected. Failures here must
   * never break the user-facing feedback action — automation is best-effort and
   * logged, not transactional with the feedback write.
   */
  private async triggerMemoryAutomation(userId: string): Promise<void> {
    if (!this.onMemorySignal) return;
    try {
      await this.onMemorySignal(userId);
    } catch (error) {
      logger.warn("memory_automation_hook_failed", {
        userId,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  private async verifyOutfitOwnership(userId: string, outfitId: string) {
    const outfit = await this.repository.findOutfitById(outfitId);
    if (!outfit) {
      throw new NotFoundError("Outfit", outfitId);
    }
    if (outfit.userId !== userId) {
      throw new ForbiddenError("This outfit belongs to another user");
    }
  }
}
