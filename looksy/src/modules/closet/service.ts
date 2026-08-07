import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { ClosetRepository } from "./repository";
import type {
  AddToWardrobeInput,
  UpdateClothingMetadataInput,
  WardrobeItemWithPhotos,
  WardrobeQuery,
} from "./types";

export class ClosetService {
  constructor(private readonly repository: ClosetRepository) {}

  async addToWardrobe(userId: string, input: AddToWardrobeInput) {
    return this.repository.insertItem(userId, input);
  }

  async getWardrobe(
    userId: string,
    query: WardrobeQuery = {}
  ): Promise<WardrobeItemWithPhotos[]> {
    return this.repository.findItemsWithPhotos(userId, {
      status: query.status ?? "active",
      ...query,
    });
  }

  async getItem(userId: string, itemId: string) {
    const item = await this.repository.findItemById(itemId);
    if (!item) {
      throw new NotFoundError("Clothing item", itemId);
    }
    if (item.userId !== userId) {
      throw new ForbiddenError("This item belongs to another user");
    }
    return item;
  }

  async updateClothingMetadata(
    userId: string,
    itemId: string,
    input: UpdateClothingMetadataInput
  ) {
    await this.getItem(userId, itemId);
    const updated = await this.repository.updateItem(itemId, input);
    if (!updated) {
      throw new NotFoundError("Clothing item", itemId);
    }
    return updated;
  }

  async removeFromWardrobe(userId: string, itemId: string) {
    await this.getItem(userId, itemId);
    return this.repository.updateStatus(itemId, "archived");
  }
}
