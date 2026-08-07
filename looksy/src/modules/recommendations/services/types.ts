import type { ClothingItemRow } from "@/modules/closet/types";
import type { UserStyleContext } from "@/modules/recommendations/types";
import type { WeatherSnapshot } from "@/modules/outfits/schema";

/** Full context handed to the PromptBuilder: user request + user data + retrieval candidates. */
export interface RecommendationContext {
  query: string;
  occasion: string | null;
  weather: WeatherSnapshot | null;
  style: UserStyleContext;
  /** Items the LLM is allowed to reference — retrieval candidates, all owned by the user. */
  candidates: ClothingItemRow[];
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
}

export interface RecommendationResult {
  userId: string;
  query: string;
  recommendation: OutfitRecommendation;
  /** Resolved wardrobe rows for every referenced itemId. */
  items: ClothingItemRow[];
  /** Verified facts from user data, grounded in the Trust Layer. */
  evidence: string[];
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
