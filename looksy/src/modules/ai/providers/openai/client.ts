import OpenAI from "openai";
import { ProviderConfigurationError } from "@/modules/ai/errors";
import { getAIProviderConfig } from "@/modules/ai/config";

let cachedClient: OpenAI | null = null;

/**
 * Builds an OpenAI-compatible client.
 *
 * The endpoint is fully configurable via environment variables:
 * - AI_API_KEY (falls back to OPENAI_API_KEY)
 * - AI_BASE_URL — custom OpenAI-compatible endpoint (OpenCode Go, LiteLLM, vLLM, etc.)
 */
export function getOpenAIClient(): OpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getAIProviderConfig();
  if (!config.apiKey) {
    throw new ProviderConfigurationError(
      "AI_API_KEY is not set (or OPENAI_API_KEY as a fallback). Add it to .env.local"
    );
  }

  cachedClient = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: 60_000,
    maxRetries: 2,
  });
  return cachedClient;
}

export function resetOpenAIClient(): void {
  cachedClient = null;
}
