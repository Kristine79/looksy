import { InvalidAIResponseError } from "@/modules/ai/errors";
import type { AIProvider, GeneratedText } from "@/modules/ai/types";
import type { RetrievalService } from "@/modules/ai/services";
import type { PromptBuilder } from "./promptBuilder";
import { parseRecommendationResponse } from "./validation";
import type { ClothingItemRow } from "@/modules/closet/types";
import type {
  OutfitRecommendation,
  RecommendationContext,
  RecommendationRequest,
  RecommendationResult,
  WhyNotRecommendedRequest,
} from "./types";

const MAX_OUTFIT_SIZE = 8;

/**
 * Recommendation Engine — end-to-end explainable recommendation flow:
 *
 * user request -> RetrievalService (RAG) -> PromptBuilder -> AIProvider.generateRecommendation
 *               -> zod validation -> normalization -> RecommendationResult
 *
 * The engine owns product logic (validation, ownership checks, Trust Layer);
 * the AI provider stays a dumb text generator.
 */
export class RecommendationService {
  constructor(
    private readonly provider: AIProvider,
    private readonly retrieval: RetrievalService,
    private readonly promptBuilder: PromptBuilder
  ) {}

  async recommend(request: RecommendationRequest): Promise<RecommendationResult> {
    const retrieval = await this.retrieval.retrieve(request.userId, request.query, {
      similarItemsLimit: request.candidatesLimit ?? 12,
    });

    const limit = request.candidatesLimit ?? 12;
    // Retrieval-first: semantic candidates (Jina) ranked by distance come first.
    // Then top up with the user's remaining active wardrobe items (deduped, up to
    // `limit`) so that active items without an embedding — which cannot appear in
    // the semantic results — are not silently dropped from the candidate pool.
    // Only `active` items are considered; archived/donated are excluded here and
    // in the semantic retrieval (see EmbeddingsRepository.findSimilarItems).
    const candidates = this.buildCandidates(
      retrieval.similarItems.map((s) => s.item),
      retrieval.context.wardrobe,
      limit,
    );

    if (candidates.length === 0) {
      return this.emptyResult(request);
    }

    const context: RecommendationContext = {
      query: request.query,
      occasion: request.occasion ?? null,
      weather: request.weather ?? null,
      style: retrieval.context,
      candidates,
    };

    const evidence = this.promptBuilder.buildEvidence(context);
    const { systemPrompt, userPrompt } = this.promptBuilder.build(context);

    const raw = await this.generateValidatedRaw(systemPrompt, userPrompt);
    const recommendation = parseRecommendationResponse(raw.content);

    const ownedIds = new Set(candidates.map((c) => c.id));
    const outfit = this.normalizeOutfit(recommendation.outfit, ownedIds);
    if (outfit.length === 0) {
      throw new InvalidAIResponseError(
        "Recommendation referenced no items from the user's wardrobe",
        { itemIds: recommendation.outfit.map((o) => o.itemId) }
      );
    }

    const usedIds = new Set(outfit.map((o) => o.itemId));
    const items = candidates.filter((c) => usedIds.has(c.id));

    return {
      userId: request.userId,
      query: request.query,
      recommendation: { ...recommendation, outfit },
      items,
      evidence,
      model: raw.model,
      createdAt: new Date(),
    };
  }

  /**
   * Merges semantic (distance-ranked) candidates with the active wardrobe,
   * preserving semantic order, removing duplicates and capping at `limit`.
   * Both sources are filtered to `active` items — archived/donated items can
   * never enter the candidate pool, whether they came from the semantic
   * retrieval (also filtered in SQL) or the wardrobe. Active wardrobe items
   * missing from the semantic set (e.g. items with no embedding yet) are
   * appended, so they remain eligible when there is capacity. Items are kept
   * unique by id.
   */
  private buildCandidates(
    semanticItems: ClothingItemRow[],
    wardrobe: ClothingItemRow[],
    limit: number,
  ): ClothingItemRow[] {
    const activeWardrobe = wardrobe.filter((item) => item.status === "active");
    const seen = new Set<string>();
    const merged: ClothingItemRow[] = [];
    for (const item of [...semanticItems, ...activeWardrobe]) {
      if (item.status !== "active") continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
      if (merged.length >= limit) break;
    }
    return merged;
  }

  /**
   * Negative reasoning — contract/stub for now.
   * Future flow: "why was this specific item NOT chosen" — item level
   * explanations (swap reasoning, rotation, context mismatch).
   */
  async whyNotRecommended(_request: WhyNotRecommendedRequest): Promise<never> {
    throw new Error("whyNotRecommended is not implemented yet (Phase 6)");
  }

  /**
   * One retry when the model returns invalid JSON: re-call with an explicit
   * reminder. The final parse still happens in the caller.
   */
  private async generateValidatedRaw(
    systemPrompt: string,
    userPrompt: string
  ): Promise<GeneratedText> {
    const first = await this.provider.generateRecommendation({ systemPrompt, userPrompt });
    try {
      parseRecommendationResponse(first.content);
      return first;
    } catch {
      const retryPrompt = [
        userPrompt,
        "",
        "Your previous response was invalid. Return ONLY the JSON object described in the system prompt — no markdown, no commentary.",
      ].join("\n");
      return this.provider.generateRecommendation({ systemPrompt, userPrompt: retryPrompt });
    }
  }

  private normalizeOutfit(
    outfit: OutfitRecommendation["outfit"],
    ownedIds: Set<string>
  ): OutfitRecommendation["outfit"] {
    const seen = new Set<string>();
    const normalized: OutfitRecommendation["outfit"] = [];
    for (const item of outfit) {
      if (ownedIds.has(item.itemId) && !seen.has(item.itemId)) {
        seen.add(item.itemId);
        normalized.push(item);
        if (normalized.length >= MAX_OUTFIT_SIZE) break;
      }
    }
    return normalized;
  }

  private emptyResult(request: RecommendationRequest): RecommendationResult {
    return {
      userId: request.userId,
      query: request.query,
      recommendation: {
        outfit: [],
        explanation: {
          whyChosen: "Your wardrobe is empty. Add items to receive personalized recommendations.",
          styleMatch: "",
          contextMatch: "",
        },
        confidence: 0,
      },
      items: [],
      evidence: [],
      model: "",
      createdAt: new Date(),
    };
  }
}
