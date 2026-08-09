import type { ClothingItemRow } from "@/modules/closet/types";
import type { OutfitRecommendation, RecommendationResult } from "./services";
import type { Locale } from "@/i18n";
import { translate } from "@/i18n";

/**
 * Deterministic recommendation fallback.
 *
 * Used when the AI provider is unavailable (auth, timeout, 5xx, network) so the
 * recommendation pipeline never surfaces a raw provider error to the user.
 * The fallback builds a valid outfit from the user's own wardrobe, sorted by
 * wear history, and is clearly marked via `model: "fallback"` + `degraded: true`
 * so the UI can show a non-technical notice.
 *
 * All user-facing strings are resolved through the i18n dictionary at call
 * time, so the same fallback serves every locale.
 */

export const FALLBACK_MODEL = "fallback";
export const FALLBACK_CONFIDENCE = 0.3;
export const MAX_FALLBACK_ITEMS = 5;

export function fallbackMessage(locale: Locale): string {
  return translate(locale, "recommendation.fallbackNotice");
}

export function emptyWardrobeMessage(locale: Locale): string {
  return translate(locale, "recommendation.emptyWardrobe");
}

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
  locale: Locale = "en",
): Pick<RecommendationResult, "recommendation" | "items" | "model"> {
  const ranked = rankItems(items).slice(0, MAX_FALLBACK_ITEMS);

  const recommendation: OutfitRecommendation = {
    outfit: ranked.map((item, index) => ({
      itemId: item.id,
      reason: fallbackReason(item, index, locale),
    })),
    explanation: {
      whyChosen:
        ranked.length > 0
          ? translate(locale, "recommendation.fallbackWhyChosen")
          : emptyWardrobeMessage(locale),
      styleMatch: "",
      contextMatch: "",
    },
    confidence: ranked.length > 0 ? FALLBACK_CONFIDENCE : 0,
  };

  return { recommendation, items: ranked, model: FALLBACK_MODEL };
}

function fallbackReason(item: ClothingItemRow, index: number, locale: Locale): string {
  if (item.wearCount > 0) {
    return translate(locale, "recommendation.fallbackReasonWorn", { count: item.wearCount });
  }
  return translate(
    locale,
    index === 0 ? "recommendation.fallbackReasonRecent" : "recommendation.fallbackReasonPaired",
  );
}

/**
 * Empty-wardrobe result — no AI call, no fallback items. Mirrors the shape
 * produced by `RecommendationService.emptyResult` so the caller can short-circuit
 * before invoking the embedding-backed retrieval path.
 */
export function buildEmptyResult(
  locale: Locale = "en",
): Pick<RecommendationResult, "recommendation" | "items" | "evidence" | "model"> {
  return {
    recommendation: {
      outfit: [],
      explanation: {
        whyChosen: emptyWardrobeMessage(locale),
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
