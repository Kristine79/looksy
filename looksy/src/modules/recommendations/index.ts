// Recommendations module — public API
export { fashionMemories, memoryEvidence, userStyleProfiles } from "./schema";
export type {
  EvidenceSourceType,
  EvidenceType,
  MemorySource,
  MemoryStatus,
  MemoryType,
  StyleDna,
} from "./schema";
export { MemoriesRepository } from "./repository";
export { FashionMemoryService, computeStatusFromConfidence } from "./service";
export { RecommendationContextService } from "./contextService";
export type {
  CreateMemoryInput,
  EvidenceInput,
  FashionMemoryRow,
  MemoryEvidenceRow,
  MemoryQuery,
  MemoryWithEvidence,
  UserStyleContext,
  UserStyleProfileRow,
} from "./types";
export { PromptBuilder, RecommendationService } from "./services";
export {
  outfitRecommendationSchema,
  parseRecommendationResponse,
  recommendationExplanationSchema,
  recommendedItemSchema,
} from "./services";
export type {
  OutfitRecommendation,
  RecommendedItem,
  RecommendationContext,
  RecommendationExplanation,
  RecommendationPrompt,
  RecommendationRequest,
  RecommendationResult,
  WhyNotRecommendedRequest,
} from "./services";
