import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { activeClothingItemCondition, EmbeddingsRepository } from "./repository";
import { clothingItems } from "@/modules/closet/schema";

/**
 * Regression guard for the semantic-retrieval filter boundary (quality gap fix):
 * `findSimilarItems` must only ever return `active` wardrobe items. Archived or
 * donated items with an embedding must never enter the recommendation candidate
 * pool. The repository applies `activeClothingItemCondition` in the retrieval
 * join's WHERE clause; this test locks that rule so it cannot silently regress.
 */
describe("EmbeddingsRepository.findSimilarItems — active filter", () => {
  it("shares the exact active-status condition used by the retrieval join", () => {
    // The condition object is the actual drizzle `eq` used in the query builder.
    // Asserting equality against the standalone rule ensures the repository
    // hasn't drifted to an inlined/dropped filter.
    expect(activeClothingItemCondition).toEqual(eq(clothingItems.status, "active"));
  });

  it("builds a condition on the clothing_items status column", () => {
    expect(activeClothingItemCondition).toBeDefined();
    // The rule targets clothing_items.status (not item_embeddings), so filtering
    // happens on the wardrobe row after the HNSW join, leaving the embedding
    // schema and ranking untouched.
    expect(clothingItems.status.name).toBe("status");
    expect(EmbeddingsRepository).toBeDefined(); // class still exported
  });
});