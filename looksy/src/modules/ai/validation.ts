import { z } from "zod";
import { InvalidAIResponseError } from "./errors";
import type { ClothingAnalysisResult } from "./types";

/** Categories the vision prompt asks for and the wardrobe expects. */
export const VALID_CATEGORIES = new Set([
  "shirt", "tshirt", "pants", "jeans", "shorts", "dress", "skirt", "jacket",
  "coat", "sweater", "hoodie", "cardigan", "blazer", "suit", "shoes",
  "sneakers", "boots", "sandals", "hat", "cap", "scarf", "gloves", "belt",
  "bag", "other",
]);

/**
 * Maps common model output variants onto enum-compatible categories.
 * Applied before validation so a drifting label ("t-shirt", "top", "Clothing")
 * never leaks into the wardrobe; anything unrecognized becomes "other".
 */
const CATEGORY_ALIASES: Record<string, string> = {
  "t-shirt": "tshirt",
  "t shirt": "tshirt",
  "t-shirts": "tshirt",
  "tshirts": "tshirt",
  "tee": "tshirt",
  "tee-shirt": "tshirt",
  "tee shirt": "tshirt",
  "tees": "tshirt",
  "clothing": "other",
  "garment": "other",
  "apparel": "other",
  "top": "shirt",
  "tops": "shirt",
  "blouse": "shirt",
  "blouses": "shirt",
  "dress shirt": "shirt",
  "button-down": "shirt",
  "pant": "pants",
  "jean": "jeans",
  "short": "shorts",
  "shoe": "shoes",
  "sneaker": "sneakers",
  "boot": "boots",
  "sandal": "sandals",
  "glove": "gloves",
  "hoody": "hoodie",
  "jumper": "sweater",
  "pullover": "sweater",
  "sport coat": "blazer",
  "suit jacket": "blazer",
};

export function normalizeCategory(value: string): string {
  const key = value.trim().toLowerCase();
  if (!key) {
    return value;
  }
  const mapped = CATEGORY_ALIASES[key] ?? key;
  return VALID_CATEGORIES.has(mapped) ? mapped : "other";
}

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
  const input =
    typeof data === "object" && data !== null && "category" in data && typeof data.category === "string"
      ? { ...(data as Record<string, unknown>), category: normalizeCategory(data.category) }
      : data;
  const result = clothingAnalysisSchema.safeParse(input);
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
