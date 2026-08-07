import type { ClothingItemRow } from "@/modules/closet/types";
import type { UserStyleContext } from "@/modules/recommendations/types";
import type { OutfitGenerationContext, OutfitItemInput, OutfitScores } from "@/modules/outfits/types";

export const VISION_MODEL = "gpt-4o-mini";
export const GENERATION_MODEL = "gpt-4o";

// ---------- Embeddings ----------

export interface EmbedRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResult {
  vector: number[];
  model: string;
  dimensions: number;
}

// ---------- Clothing Analysis ----------

export interface AnalyzedColor {
  name: string;
  hex: string;
  dominance: number;
}

export interface ClothingAnalysisResult {
  category: string;
  subcategory: string | null;
  colors: AnalyzedColor[];
  material: string | null;
  pattern: string | null;
  style: string | null;
  season: string[];
  formality: number;
  attributes: Record<string, unknown>;
}

export interface ClothingAnalysisRequest {
  imageUrl: string;
  model?: string;
}

export interface ClothingAnalysisWithConfidence extends ClothingAnalysisResult {
  confidence: number;
  model: string;
}

// ---------- Text generation (recommendation / explanation) ----------

export interface TextGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}

export interface GeneratedText {
  content: string;
  model: string;
}

/** Raw-JSON recommendation request. Validation against the product schema happens in the service layer. */
export type GenerateRecommendationRequest = TextGenerationRequest;

/** Raw-JSON explanation request for an already-selected set of items. */
export type GenerateExplanationRequest = TextGenerationRequest;

// ---------- Outfit Generation (contract only, not implemented) ----------

export interface GenerateOutfitsRequest {
  userId: string;
  context: OutfitGenerationContext;
  count?: number;
}

export interface GeneratedOutfit {
  items: OutfitItemInput[];
  explanation: string;
  scores?: OutfitScores;
}

// ---------- Provider abstraction ----------

/** Contract every AI provider (OpenAI, Gemini, Claude, local) must implement. */
export interface AIProvider {
  readonly model: string;
  readonly embeddingModel: string;
  readonly visionModel: string;

  embed(request: EmbedRequest): Promise<EmbeddingResult>;
  analyzeClothingImage(request: ClothingAnalysisRequest): Promise<ClothingAnalysisWithConfidence>;
  generateRecommendation(request: GenerateRecommendationRequest): Promise<GeneratedText>;
  generateExplanation(request: GenerateExplanationRequest): Promise<GeneratedText>;
  generateOutfits(request: GenerateOutfitsRequest): Promise<GeneratedOutfit[]>;
}

// ---------- RAG / Retrieval ----------

export interface SimilarItem {
  item: ClothingItemRow;
  distance: number;
}

export interface RetrievalResult {
  userId: string;
  query: string;
  queryEmbedding: number[];
  similarItems: SimilarItem[];
  context: UserStyleContext;
}
