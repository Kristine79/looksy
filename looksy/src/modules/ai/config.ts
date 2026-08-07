import { EMBEDDING_MODEL } from "./schema";
import { GENERATION_MODEL, VISION_MODEL } from "./types";

/**
 * AI provider configuration, resolved from environment variables.
 *
 * Any OpenAI-compatible endpoint can be used:
 * - AI_API_KEY / OPENAI_API_KEY  — API key
 * - AI_BASE_URL                  — base URL override (custom OpenAI-compatible endpoint)
 * - AI_MODEL                     — generation model used for recommendations
 * - AI_VISION_MODEL              — vision model used for clothing analysis
 * - AI_EMBEDDING_MODEL           — embeddings model
 *
 * Business logic never reads env directly; it depends on the AIProvider
 * contract, which is configured from this config at construction time.
 */
export interface AIProviderConfig {
  apiKey: string | undefined;
  baseURL: string | undefined;
  generationModel: string;
  visionModel: string;
  embeddingModel: string;
}

export function getAIProviderConfig(
  env: Record<string, string | undefined> = process.env
): AIProviderConfig {
  return {
    apiKey: env.AI_API_KEY ?? env.OPENAI_API_KEY,
    baseURL: env.AI_BASE_URL || undefined,
    generationModel: env.AI_MODEL ?? GENERATION_MODEL,
    visionModel: env.AI_VISION_MODEL ?? VISION_MODEL,
    embeddingModel: env.AI_EMBEDDING_MODEL ?? EMBEDDING_MODEL,
  };
}
