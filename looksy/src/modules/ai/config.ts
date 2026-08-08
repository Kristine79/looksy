import { EMBEDDING_MODEL } from "./schema";
import { GENERATION_MODEL, VISION_MODEL } from "./types";

/**
 * Jina AI embedding provider config (embeddings only).
 *
 * Jina is used exclusively for embeddings because the primary chat provider
 * (OpenCode Go / DeepSeek) does not expose an embeddings endpoint. Chat and
 * vision stay on the primary provider.
 *
 * - JINA_API_KEY / JINA_AI_KEY  — API key (either name is accepted)
 * - JINA_BASE_URL               — defaults to https://api.jina.ai/v1
 * - JINA_EMBEDDING_MODEL        — embedding model (default: jina-embeddings-v4,
 *                                 which supports 1536 dimensions and is
 *                                 compatible with the existing pgvector column)
 */
export interface JinaEmbeddingConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * AI provider configuration, resolved from environment variables.
 *
 * Any OpenAI-compatible endpoint can be used:
 * - AI_API_KEY / OPENAI_API_KEY  — API key
 * - AI_BASE_URL                  — base URL override (custom OpenAI-compatible endpoint)
 * - AI_MODEL                     — general chat/generation model (may be a reasoning model)
 * - AI_RECOMMENDATION_MODEL      — model for final Today's Look outfit generation
 *                                  (non-reasoning, predictable latency / structured JSON).
 *                                  Falls back to AI_MODEL when not set.
 * - AI_VISION_MODEL              — vision model used for clothing analysis
 * - AI_EMBEDDING_MODEL           — embeddings model (legacy path; Jina is primary)
 *
 * Business logic never reads env directly; it depends on the AIProvider
 * contract, which is configured from this config at construction time.
 */
export interface AIProviderConfig {
  apiKey: string | undefined;
  baseURL: string | undefined;
  generationModel: string;
  /** Model used for the final outfit recommendation (Today's Look) generation. */
  recommendationModel: string;
  visionModel: string;
  embeddingModel: string;
  /** Optional Jina embedding provider — used for embeddings when configured. */
  jinaEmbedding: JinaEmbeddingConfig | null;
}

export const DEFAULT_JINA_EMBEDDING_MODEL = "jina-embeddings-v4";
export const DEFAULT_JINA_BASE_URL = "https://api.jina.ai/v1";

export function getAIProviderConfig(
  env: Record<string, string | undefined> = process.env
): AIProviderConfig {
  const jinaApiKey = env.JINA_API_KEY ?? env.JINA_AI_KEY;
  const generationModel = env.AI_MODEL ?? GENERATION_MODEL;
  return {
    apiKey: env.AI_API_KEY ?? env.OPENAI_API_KEY,
    baseURL: env.AI_BASE_URL || undefined,
    generationModel,
    recommendationModel: env.AI_RECOMMENDATION_MODEL ?? generationModel,
    visionModel: env.AI_VISION_MODEL ?? VISION_MODEL,
    embeddingModel: env.AI_EMBEDDING_MODEL ?? EMBEDDING_MODEL,
    jinaEmbedding: jinaApiKey
      ? {
          apiKey: jinaApiKey,
          baseURL: env.JINA_BASE_URL || DEFAULT_JINA_BASE_URL,
          model: env.JINA_EMBEDDING_MODEL ?? DEFAULT_JINA_EMBEDDING_MODEL,
        }
      : null,
  };
}
