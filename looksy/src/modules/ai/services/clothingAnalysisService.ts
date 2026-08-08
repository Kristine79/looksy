import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { ClosetRepository } from "@/modules/closet/repository";
import type { EmbeddingsRepository } from "@/modules/ai/repository";
import type { AIProvider, ClothingAnalysisResult } from "@/modules/ai/types";
import { validateClothingAnalysis } from "@/modules/ai/validation";
import { buildItemTextRepresentation } from "./embeddingService";

export type AnalysisOutcome =
  | { status: "completed"; itemId: string; analysis: ClothingAnalysisResult }
  | { status: "failed"; itemId: string; error: string };

/**
 * User-facing analysis error. Raw provider errors are logged, never persisted
 * or returned: `aiError` and `AnalysisOutcome.error` must stay non-technical
 * so no API response or UI ever exposes an OpenAI message.
 */
export const ANALYSIS_ERROR_MESSAGE =
  "LOOKSY couldn't analyze this item right now. You can retry.";

export class ClothingAnalysisService {
  constructor(
    private readonly provider: AIProvider,
    private readonly closetRepository: ClosetRepository,
    private readonly embeddingsRepository: EmbeddingsRepository
  ) {}

  /** Full pipeline: image -> vision -> validate -> persist metadata -> embedding -> update item. */
  async analyzeClothingItem(userId: string, itemId: string, imageUrl: string): Promise<AnalysisOutcome> {
    const item = await this.closetRepository.findItemById(itemId);
    if (!item) {
      throw new NotFoundError("Clothing item", itemId);
    }
    if (item.userId !== userId) {
      throw new ForbiddenError("This item belongs to another user");
    }

    // 1. mark as processing (retry-ready: allows re-processing failed items)
    await this.closetRepository.updateAiMetadata(itemId, {
      aiStatus: "processing",
      aiError: null,
    });

    try {
      // 2. vision analysis
      const visionResult = await this.provider.analyzeClothingImage({ imageUrl });

      // 3. validation
      const analysis = validateClothingAnalysis({
        ...visionResult,
        attributes: visionResult.attributes ?? {},
        season: visionResult.season ?? [],
        subcategory: visionResult.subcategory ?? null,
      });

      // 4. persist extracted metadata
      const updatedItem = await this.closetRepository.updateAiMetadata(itemId, {
        type: analysis.category,
        subType: analysis.subcategory,
        material: analysis.material,
        pattern: analysis.pattern,
        colors: analysis.colors,
        seasons: analysis.season,
        formality: analysis.formality,
        aiStatus: "completed",
        aiConfidence: visionResult.confidence,
        aiModelVersion: visionResult.model,
        aiPayload: analysis.attributes,
        aiProcessedAt: new Date(),
        metadata: {
          style: analysis.style ?? undefined,
          ...analysis.attributes,
        },
      });

      // 5. generate embedding from enriched metadata
      const embedding = await this.provider.embed({
        text: buildItemTextRepresentation(updatedItem ?? item),
      });
      await this.embeddingsRepository.upsertItemEmbedding({
        itemId,
        userId,
        embedding: embedding.vector,
        textRepr: buildItemTextRepresentation(updatedItem ?? item),
        model: embedding.model,
        dimension: embedding.dimensions,
      });

      logger.info("clothing_analysis_completed", { itemId, category: analysis.category });
      return { status: "completed", itemId, analysis };
    } catch (error) {
      const raw = error instanceof Error ? error.message : "unknown error";
      logger.error("clothing_analysis_failed", { itemId, error: raw });
      await this.closetRepository.updateAiMetadata(itemId, {
        aiStatus: "failed",
        aiError: ANALYSIS_ERROR_MESSAGE,
        aiProcessedAt: new Date(),
      });
      return { status: "failed", itemId, error: ANALYSIS_ERROR_MESSAGE };
    }
  }

  /** Re-process a previously failed item (retry-ready structure). */
  async reprocessClothingItem(userId: string, itemId: string, imageUrl: string): Promise<AnalysisOutcome> {
    return this.analyzeClothingItem(userId, itemId, imageUrl);
  }
}
