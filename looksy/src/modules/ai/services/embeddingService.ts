import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { ClosetRepository } from "@/modules/closet/repository";
import type { ClothingItemRow } from "@/modules/closet/types";
import type { AIProvider, EmbeddingResult } from "@/modules/ai/types";
import { EMBEDDING_DIMENSIONS } from "@/modules/ai/schema";
import type { EmbeddingsRepository } from "@/modules/ai/repository";

/** Build a deterministic text representation of an item for embedding. */
export function buildItemTextRepresentation(item: ClothingItemRow): string {
  const parts: string[] = [item.type];
  if (item.subType) parts.push(item.subType);
  if (item.brand) parts.push(item.brand);
  if (item.material) parts.push(item.material);
  if (item.pattern) parts.push(item.pattern);
  if (item.colors && item.colors.length > 0) {
    parts.push(item.colors.map((c) => c.name).join(" "));
  }
  if (item.formality) parts.push(`formality ${item.formality}/5`);
  return parts.join(", ");
}

export class EmbeddingService {
  constructor(
    private readonly provider: AIProvider,
    private readonly embeddingsRepository: EmbeddingsRepository,
    private readonly closetRepository: ClosetRepository
  ) {}

  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    return this.provider.embed({ text, model });
  }

  async embedClothingItem(userId: string, itemId: string): Promise<EmbeddingResult> {
    const item = await this.closetRepository.findItemById(itemId);
    if (!item) {
      throw new NotFoundError("Clothing item", itemId);
    }
    if (item.userId !== userId) {
      throw new ForbiddenError("This item belongs to another user");
    }

    const textRepr = buildItemTextRepresentation(item);
    const result = await this.generateEmbedding(textRepr);

    await this.embeddingsRepository.upsertItemEmbedding({
      itemId,
      userId,
      embedding: result.vector,
      textRepr,
      model: result.model,
      dimension: EMBEDDING_DIMENSIONS,
    });

    return result;
  }
}
