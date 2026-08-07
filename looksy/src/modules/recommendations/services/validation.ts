import { z } from "zod";
import { InvalidAIResponseError } from "@/modules/ai/errors";
import type { OutfitRecommendation } from "./types";

export const recommendedItemSchema = z.object({
  itemId: z.string().min(1),
  reason: z.string().min(1),
});

export const recommendationExplanationSchema = z.object({
  whyChosen: z.string().min(1),
  styleMatch: z.string().min(1),
  contextMatch: z.string().min(1),
});

export const outfitRecommendationSchema = z.object({
  outfit: z.array(recommendedItemSchema).min(1).max(15),
  explanation: recommendationExplanationSchema,
  confidence: z.number().min(0).max(1),
});

/**
 * Parses the raw LLM text into a validated OutfitRecommendation.
 * Tolerates code fences and surrounding prose, but the payload itself
 * must be valid JSON matching the schema.
 */
export function parseRecommendationResponse(content: string): OutfitRecommendation {
  const cleaned = extractJsonObject(content);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new InvalidAIResponseError(
      "Recommendation response is not valid JSON",
      { snippet: cleaned.slice(0, 200) }
    );
  }

  const result = outfitRecommendationSchema.safeParse(parsed);
  if (!result.success) {
    throw new InvalidAIResponseError(
      "Recommendation response failed schema validation",
      {
        issues: result.error.issues.map(
          (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`
        ),
      }
    );
  }

  return result.data;
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence && fence[1]) {
    return fence[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}
