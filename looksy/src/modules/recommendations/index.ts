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
export { MemoryAutomationService, freshnessFactor, SIGNAL_WEIGHTS, CREATION_SIGNAL_THRESHOLD, USER_CORRECTION_OVERRIDE_FRESH_SIGNALS } from "./automationService";
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
export { PromptBuilder, RecommendationService, formatEvidenceForPrompt } from "./services";
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
  StructuredEvidence,
  WhyNotRecommendedRequest,
} from "./services";
