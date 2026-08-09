// Recommendation engine services — public API
export { PromptBuilder, formatEvidenceForPrompt } from "./promptBuilder";
export { RecommendationService } from "./recommendationService";
export {
  outfitRecommendationSchema,
  parseRecommendationResponse,
  recommendationExplanationSchema,
  recommendedItemSchema,
} from "./validation";
export type {
  OutfitRecommendation,
  RecommendedItem,
  RecommendationContext,
  RecommendationExplanation,
  RecommendationPrompt,
  RecommendationRequest,
  RecommendationResult,
  StructuredEvidence,
  WhyNotRecommendedRequest,
} from "./types";
