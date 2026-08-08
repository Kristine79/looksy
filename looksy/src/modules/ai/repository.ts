import { desc, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import { clothingItems } from "@/modules/closet/schema";
import { itemEmbeddings } from "./schema";
import type { SimilarItem } from "./types";

export type DbClient = PostgresJsDatabase<typeof schema>;

export class EmbeddingsRepository {
  constructor(private readonly db: DbClient) {}

  async upsertItemEmbedding(input: {
    itemId: string;
    userId: string;
    embedding: number[];
    textRepr: string;
    model: string;
    dimension: number;
  }) {
    const rows = await this.db
      .insert(itemEmbeddings)
      .values(input)
      .onConflictDoUpdate({
        target: [itemEmbeddings.itemId, itemEmbeddings.model],
        set: {
          embedding: input.embedding,
          textRepr: input.textRepr,
          updatedAt: new Date(),
        },
      })
      .returning();
    return rows[0]!;
  }

  /**
   * Finds similar items, one row per item. An item can hold several embedding
   * rows (one per model — e.g. the semantic model plus the deterministic
   * fallback after a provider failure), so we dedupe by item and prefer the
   * non-fallback model before ranking by distance.
   */
  async findSimilarItems(
    userId: string,
    embedding: number[],
    limit: number
  ): Promise<SimilarItem[]> {
    const vectorLiteral = `[${embedding.join(",")}]`;
    const distance = sql<number>`${itemEmbeddings.embedding} <=> ${vectorLiteral}::vector`.as(
      "distance"
    );
    const modelPriority = sql<number>`case when ${itemEmbeddings.model} = 'deterministic-fallback-v1' then 1 else 0 end`.as(
      "model_priority"
    );

    const bestEmbedding = this.db
      .selectDistinctOn(
        [itemEmbeddings.itemId],
        {
          itemId: itemEmbeddings.itemId,
          distance,
          modelPriority,
        }
      )
      .from(itemEmbeddings)
      .where(eq(itemEmbeddings.userId, userId))
      .orderBy(itemEmbeddings.itemId, modelPriority, distance)
      .as("best_embedding");

    const rows = await this.db
      .select({
        item: clothingItems,
        distance: bestEmbedding.distance,
      })
      .from(bestEmbedding)
      .innerJoin(clothingItems, eq(clothingItems.id, bestEmbedding.itemId))
      .orderBy(bestEmbedding.distance)
      .limit(limit);

    return rows.map(({ item, distance: d }) => ({ item, distance: d }));
  }

  async findEmbeddingByItemId(itemId: string) {
    const rows = await this.db
      .select()
      .from(itemEmbeddings)
      .where(eq(itemEmbeddings.itemId, itemId))
      .orderBy(desc(itemEmbeddings.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async deleteItemEmbedding(itemId: string) {
    await this.db.delete(itemEmbeddings).where(eq(itemEmbeddings.itemId, itemId));
  }
}
