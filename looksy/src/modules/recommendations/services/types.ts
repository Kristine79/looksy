import type { ClothingItemRow } from "@/modules/closet/types";
import type { UserStyleContext } from "@/modules/recommendations/types";
import type { WeatherSnapshot } from "@/modules/outfits/schema";
import type { EvidenceKey } from "@/modules/outfits/schema";
import type { Locale } from "@/i18n";

/** Structured evidence fact: a typed, locale-independent presentation hint plus
 *  the canonical English rendering used in LLM prompts and persisted history. */
export interface StructuredEvidence {
  key: EvidenceKey;
  /** Shape depends on `key`; see EvidenceList renderers. */
  params: Record<string, unknown>;
  /** Canonical English rendering — used in LLM prompts and as `text` fallback. */
  en: string;
}

/** Full context handed to the PromptBuilder: user request + user data + retrieval candidates. */
export interface RecommendationContext {
  query: string;
  occasion: string | null;
  weather: WeatherSnapshot | null;
  style: UserStyleContext;
  /** Items the LLM is allowed to reference — retrieval candidates, all owned by the user. */
  candidates: ClothingItemRow[];
  /** Language the user-facing AI text should be written in. */
  locale: Locale;
}

export interface RecommendedItem {
  itemId: string;
  reason: string;
}

export interface RecommendationExplanation {
  whyChosen: string;
  styleMatch: string;
  contextMatch: string;
}

export interface OutfitRecommendation {
  outfit: RecommendedItem[];
  explanation: RecommendationExplanation;
  confidence: number;
}

export interface RecommendationRequest {
  userId: string;
  query: string;
  occasion?: string | null;
  weather?: WeatherSnapshot | null;
  candidatesLimit?: number;
  /** Language for user-facing AI text; default "en". */
  locale?: Locale;
}

export interface RecommendationResult {
  userId: string;
  query: string;
  recommendation: OutfitRecommendation;
  /** Resolved wardrobe rows for every referenced itemId. */
  items: ClothingItemRow[];
  /** Verified facts from user data, grounded in the Trust Layer. */
  evidence: StructuredEvidence[];
  model: string;
  createdAt: Date;
}

export interface WhyNotRecommendedRequest {
  userId: string;
  itemId: string;
  query: string;
  occasion?: string | null;
  weather?: WeatherSnapshot | null;
}

export interface RecommendationPrompt {
  systemPrompt: string;
  userPrompt: string;
}
