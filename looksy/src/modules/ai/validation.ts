import { z } from "zod";
import { InvalidAIResponseError } from "./errors";
import type { ClothingAnalysisResult } from "./types";

const analyzedColorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  dominance: z.number().min(0).max(1),
});

export const clothingAnalysisSchema = z.object({
  category: z.string().min(1),
  subcategory: z.string().nullable(),
  colors: z.array(analyzedColorSchema).max(8),
  material: z.string().nullable(),
  pattern: z.string().nullable(),
  style: z.string().nullable(),
  season: z.array(z.string()).max(4),
  formality: z.number().int().min(1).max(5),
  attributes: z.record(z.unknown()),
});

export function validateClothingAnalysis(data: unknown): ClothingAnalysisResult {
  const result = clothingAnalysisSchema.safeParse(data);
  if (!result.success) {
    throw new InvalidAIResponseError("Vision response failed validation", {
      issues: result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }
  return result.data;
}
