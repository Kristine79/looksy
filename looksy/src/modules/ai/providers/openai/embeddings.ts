import type OpenAI from "openai";
import {
  InvalidAIResponseError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "@/modules/ai/errors";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/modules/ai/schema";
import { logger } from "@/lib/logger";
import type { EmbedRequest, EmbeddingResult } from "@/modules/ai/types";

/**
 * Deterministic fallback embedding used when the configured endpoint does not
 * expose an embeddings API (e.g. OpenCode Go). Marked with its own model name
 * in the database so it stays auditable; retrieval still works deterministically.
 */
export const DETERMINISTIC_EMBEDDING_MODEL = "deterministic-fallback-v1";

export function deterministicEmbedding(text: string): number[] {
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }
  let state = seed >>> 0;
  const vector: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    vector.push((state % 1000) / 1000 - 0.5);
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map((v) => v / norm);
}

export async function createEmbedding(
  client: OpenAI,
  request: EmbedRequest
): Promise<EmbeddingResult> {
  const model = request.model ?? EMBEDDING_MODEL;

  try {
    const response = await client.embeddings.create({
      model,
      input: request.text,
    });

    const vector = response.data[0]?.embedding;
    if (!vector || vector.length !== EMBEDDING_DIMENSIONS) {
      throw new InvalidAIResponseError(
        `Embedding response has unexpected shape: ${vector?.length ?? "no vector"} dimensions`,
        { expected: EMBEDDING_DIMENSIONS, received: vector?.length ?? null }
      );
    }

    return { vector, model, dimensions: EMBEDDING_DIMENSIONS };
  } catch (error) {
    logger.warn("embedding_fallback_to_deterministic", {
      model,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return {
      vector: deterministicEmbedding(request.text),
      model: DETERMINISTIC_EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }
}

export function mapProviderError(error: unknown, operation: string): Error {
  if (error instanceof Error && "status" in error) {
    const status = (error as { status?: number }).status;
    if (status === 429) {
      return new ProviderRateLimitError(`Rate limited during ${operation}`, {
        message: error.message,
      });
    }
    if (status === 408 || error.message.includes("timeout")) {
      return new ProviderTimeoutError(`Timeout during ${operation}`, {
        message: error.message,
      });
    }
  }
  if (error instanceof Error) {
    return new InvalidAIResponseError(`Failed to ${operation}: ${error.message}`);
  }
  return new InvalidAIResponseError(`Failed to ${operation}: unknown error`);
}
