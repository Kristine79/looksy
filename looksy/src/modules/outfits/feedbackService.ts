import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { OutfitsRepository } from "./repository";
import type { RecordFeedbackInput, RecordSwapInput, RecordWearInput } from "./types";

export class FeedbackService {
  constructor(private readonly repository: OutfitsRepository) {}

  async recordWear(userId: string, input: RecordWearInput) {
    if (input.itemIds.length === 0) {
      throw new ValidationError("recordWear requires at least one itemId");
    }

    if (input.outfitId) {
      await this.verifyOutfitOwnership(userId, input.outfitId);
    }

    const wearLogRow = await this.repository.insertWearLog(userId, input);
    await this.repository.bumpItemWearCounters(input.itemIds, input.wornAt ?? new Date());
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
    return feedback;
  }

  async recordSwap(userId: string, input: RecordSwapInput) {
    if (input.outfitId) {
      await this.verifyOutfitOwnership(userId, input.outfitId);
    }
    return this.repository.insertFeedback(userId, input, "swap");
  }

  async recordSkip(userId: string, input: RecordFeedbackInput) {
    if (input.outfitId) {
      await this.verifyOutfitOwnership(userId, input.outfitId);
    }
    const feedback = await this.repository.insertFeedback(userId, input, "skip");
    if (input.outfitId) {
      await this.repository.updateOutfitStatus(input.outfitId, "dismissed");
    }
    return feedback;
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
