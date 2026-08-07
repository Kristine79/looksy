// AI module — public API
export { itemEmbeddings, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./schema";
export { getAIProviderConfig } from "./config";
export type { AIProviderConfig } from "./config";
export type {
  AIProvider,
  AnalyzedColor,
  ClothingAnalysisRequest,
  ClothingAnalysisResult,
  ClothingAnalysisWithConfidence,
  EmbedRequest,
  EmbeddingResult,
  GenerateExplanationRequest,
  GenerateRecommendationRequest,
  GenerateOutfitsRequest,
  GeneratedOutfit,
  GeneratedText,
  RetrievalResult,
  SimilarItem,
  TextGenerationRequest,
} from "./types";
export {
  AIError,
  InvalidAIResponseError,
  ProviderConfigurationError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  isRetryableAIError,
} from "./errors";
export { EmbeddingsRepository } from "./repository";
export {
  ClothingAnalysisService,
  EmbeddingService,
  RetrievalService,
  buildItemTextRepresentation,
} from "./services";
export type { AnalysisOutcome, RetrievalOptions } from "./services";
export { OpenAIProvider } from "./providers/openai";
export { clothingAnalysisSchema, validateClothingAnalysis } from "./validation";
