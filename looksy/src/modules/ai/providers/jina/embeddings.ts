import type { JinaEmbeddingConfig } from "@/modules/ai/config";
import {
  InvalidAIResponseError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "@/modules/ai/errors";
import { EMBEDDING_DIMENSIONS } from "@/modules/ai/schema";
import type { EmbedRequest, EmbeddingResult } from "@/modules/ai/types";

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Jina AI embeddings (OpenAI-compatible endpoint). Used ONLY for embeddings —
 * chat and vision stay on the primary provider.
 *
 * Contract: requests `dimensions` explicitly so the returned vector always
 * matches the pgvector column (1536) regardless of the model's default. The
 * response is validated (shape, dimension, finite values) before it is trusted;
 * any violation throws an InvalidAIResponseError so the caller can fall back.
 */
export async function createJinaEmbedding(
  request: EmbedRequest,
  config: JinaEmbeddingConfig
): Promise<EmbeddingResult> {
  const model = request.model ?? config.model;
  const baseURL = config.baseURL.replace(/\/+$/, "");

  let response: Response;
  try {
    response = await fetch(`${baseURL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: request.text,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "network error";
    throw new ProviderTimeoutError(`Jina embedding request failed: ${message}`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const status = response.status;
    if (status === 429) {
      throw new ProviderRateLimitError("Jina rate limited during embedding", {
        message: detail.slice(0, 300),
      });
    }
    throw new InvalidAIResponseError(`Jina embedding failed with status ${status}`, {
      message: detail.slice(0, 300),
    });
  }

  const body = (await response.json()) as {
    data?: Array<{ embedding?: unknown }>;
  };

  const raw = body.data?.[0]?.embedding;
  if (!Array.isArray(raw)) {
    throw new InvalidAIResponseError("Jina embedding response has no vector data");
  }

  const vector = raw as unknown[];
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new InvalidAIResponseError(
      `Jina embedding has unexpected dimension: ${vector.length}`,
      { expected: EMBEDDING_DIMENSIONS, received: vector.length }
    );
  }

  if (!vector.every((v) => typeof v === "number" && Number.isFinite(v))) {
    throw new InvalidAIResponseError("Jina embedding contains non-finite values");
  }

  return { vector: vector as number[], model, dimensions: EMBEDDING_DIMENSIONS };
}
