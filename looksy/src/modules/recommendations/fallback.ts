import type { ClothingItemRow } from "@/modules/closet/types";
import type { OutfitRecommendation, RecommendationResult } from "./services";

/**
 * Deterministic recommendation fallback.
 *
 * Used when the AI provider is unavailable (auth, timeout, 5xx, network) so the
 * recommendation pipeline never surfaces a raw provider error to the user.
 * The fallback builds a valid outfit from the user's own wardrobe, sorted by
 * wear history, and is clearly marked via `model: "fallback"` + `degraded: true`
 * so the UI can show a non-technical notice.
 */

export const FALLBACK_MODEL = "fallback";
export const FALLBACK_CONFIDENCE = 0.3;
export const MAX_FALLBACK_ITEMS = 5;

export const FALLBACK_MESSAGE =
  "AI recommendation is temporarily unavailable. Showing a quick pick from your wardrobe.";

export const EMPTY_WARDROBE_MESSAGE =
  "Your wardrobe is empty. Add items to receive personalized recommendations.";

/**
 * Sort active wardrobe items into a deterministic fallback order:
 * most-worn first, then most-recently-worn, then newest added.
 */
function rankItems(items: ClothingItemRow[]): ClothingItemRow[] {
  return [...items].sort((a, b) => {
    if (b.wearCount !== a.wearCount) return b.wearCount - a.wearCount;
    const aLast = a.lastWorn ? a.lastWorn.getTime() : 0;
    const bLast = b.lastWorn ? b.lastWorn.getTime() : 0;
    if (bLast !== aLast) return bLast - aLast;
    const aCreated = a.createdAt ? a.createdAt.getTime() : 0;
    const bCreated = b.createdAt ? b.createdAt.getTime() : 0;
    return bCreated - aCreated;
  });
}

/**
 * Builds a deterministic fallback recommendation from the user's wardrobe.
 * Returns the recommendation shape plus the resolved item rows the outfit
 * references, mirroring the AI `RecommendationResult` contract.
 */
export function buildFallbackRecommendation(
  items: ClothingItemRow[],
): Pick<RecommendationResult, "recommendation" | "items" | "model"> {
  const ranked = rankItems(items).slice(0, MAX_FALLBACK_ITEMS);

  const recommendation: OutfitRecommendation = {
    outfit: ranked.map((item, index) => ({
      itemId: item.id,
      reason: fallbackReason(item, index),
    })),
    explanation: {
      whyChosen:
        ranked.length > 0
          ? "A quick pick from your most-worn items while AI is unavailable."
          : EMPTY_WARDROBE_MESSAGE,
      styleMatch: "",
      contextMatch: "",
    },
    confidence: ranked.length > 0 ? FALLBACK_CONFIDENCE : 0,
  };

  return { recommendation, items: ranked, model: FALLBACK_MODEL };
}

function fallbackReason(item: ClothingItemRow, index: number): string {
  if (item.wearCount > 0) {
    return `One of your most-worn items (${item.wearCount} wears).`;
  }
  return index === 0 ? "A recent addition to your wardrobe." : "Paired from your available items.";
}

/**
 * Empty-wardrobe result — no AI call, no fallback items. Mirrors the shape
 * produced by `RecommendationService.emptyResult` so the caller can short-circuit
 * before invoking the embedding-backed retrieval path.
 */
export function buildEmptyResult(): Pick<RecommendationResult, "recommendation" | "items" | "evidence" | "model"> {
  return {
    recommendation: {
      outfit: [],
      explanation: {
        whyChosen: EMPTY_WARDROBE_MESSAGE,
        styleMatch: "",
        contextMatch: "",
      },
      confidence: 0,
    },
    items: [],
    evidence: [],
    model: "",
  };
}