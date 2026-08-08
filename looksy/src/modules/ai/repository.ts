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

  async findSimilarItems(
    userId: string,
    embedding: number[],
    limit: number
  ): Promise<SimilarItem[]> {
    const vectorLiteral = `[${embedding.join(",")}]`;
    const rows = await this.db
      .select({
        item: clothingItems,
        distance: sql<number>`${itemEmbeddings.embedding} <=> ${vectorLiteral}::vector`,
      })
      .from(itemEmbeddings)
      .innerJoin(clothingItems, eq(clothingItems.id, itemEmbeddings.itemId))
      .where(eq(itemEmbeddings.userId, userId))
      .orderBy(sql`${itemEmbeddings.embedding} <=> ${vectorLiteral}::vector`)
      .limit(limit);

    return rows.map(({ item, distance }) => ({ item, distance }));
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
