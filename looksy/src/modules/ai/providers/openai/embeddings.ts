import type OpenAI from "openai";
import {
  InvalidAIResponseError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "@/modules/ai/errors";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/modules/ai/schema";
import type { EmbedRequest, EmbeddingResult } from "@/modules/ai/types";

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
    throw mapProviderError(error, "embedding");
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
