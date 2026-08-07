import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { OutfitsRepository } from "./repository";
import type {
  CreateOutfitInput,
  OutfitGenerationContext,
  OutfitGenerationContextInput,
  OutfitItemInput,
  OutfitQuery,
  OutfitWithItems,
} from "./types";

export class OutfitService {
  constructor(private readonly repository: OutfitsRepository) {}

  async createOutfit(userId: string, input: CreateOutfitInput, items: OutfitItemInput[] = []) {
    const outfit = await this.repository.insertOutfit(userId, input);
    if (items.length > 0) {
      await this.repository.insertOutfitItems(outfit.id, items);
    }
    return outfit;
  }

  async getOutfitHistory(userId: string, query: OutfitQuery = {}) {
    return this.repository.findOutfits(userId, query);
  }

  async getOutfit(userId: string, outfitId: string): Promise<OutfitWithItems> {
    const outfit = await this.repository.findOutfitById(outfitId);
    if (!outfit) {
      throw new NotFoundError("Outfit", outfitId);
    }
    if (outfit.userId !== userId) {
      throw new ForbiddenError("This outfit belongs to another user");
    }

    const outfitItems = await this.repository.findOutfitItems(outfit.id);
    return { ...outfit, items: outfitItems };
  }

  async addItemsToOutfit(userId: string, outfitId: string, items: OutfitItemInput[]) {
    const outfit = await this.repository.findOutfitById(outfitId);
    if (!outfit) {
      throw new NotFoundError("Outfit", outfitId);
    }
    if (outfit.userId !== userId) {
      throw new ForbiddenError("This outfit belongs to another user");
    }
    return this.repository.insertOutfitItems(outfit.id, items);
  }

  async saveOutfit(userId: string, outfitId: string) {
    const outfit = await this.repository.findOutfitById(outfitId);
    if (!outfit) {
      throw new NotFoundError("Outfit", outfitId);
    }
    if (outfit.userId !== userId) {
      throw new ForbiddenError("This outfit belongs to another user");
    }
    return this.repository.updateOutfitStatus(outfit.id, "saved");
  }

  async generateOutfitContext(
    userId: string,
    input: OutfitGenerationContextInput = {}
  ): Promise<OutfitGenerationContext> {
    const [candidates, recentOutfits, wearHistory] = await Promise.all([
      this.repository.findItemsForGeneration(userId, input.candidatesLimit ?? 30),
      this.repository.findOutfits(userId, { limit: 10 }),
      this.repository.findRecentWear(userId, 20),
    ]);

    return {
      request: input,
      candidates,
      recentOutfits,
      wearHistory,
    };
  }
}
