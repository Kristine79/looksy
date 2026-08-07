import { and, desc, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import { clothingItems } from "@/modules/closet/schema";
import {
  outfitFeedback,
  outfitItems,
  outfits,
  wearLog,
  wearLogItems,
} from "./schema";
import type {
  CreateOutfitInput,
  OutfitItemInput,
  OutfitQuery,
  RecordFeedbackInput,
  RecordSwapInput,
  RecordWearInput,
} from "./types";

export type DbClient = PostgresJsDatabase<typeof schema>;

export class OutfitsRepository {
  constructor(private readonly db: DbClient) {}

  async insertOutfit(userId: string, input: CreateOutfitInput) {
    const rows = await this.db
      .insert(outfits)
      .values({
        userId,
        ...input,
        source: input.source ?? "ai",
        status: "generated",
      })
      .returning();
    return rows[0]!;
  }

  async findOutfitById(outfitId: string) {
    const rows = await this.db
      .select()
      .from(outfits)
      .where(eq(outfits.id, outfitId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findOutfits(userId: string, query: OutfitQuery = {}) {
    const conditions = [eq(outfits.userId, userId)];
    if (query.status) {
      conditions.push(eq(outfits.status, query.status));
    }

    return this.db
      .select()
      .from(outfits)
      .where(and(...conditions))
      .orderBy(desc(outfits.createdAt))
      .limit(query.limit ?? 20)
      .offset(query.offset ?? 0);
  }

  async insertOutfitItems(outfitId: string, items: OutfitItemInput[]) {
    if (items.length === 0) {
      return [];
    }
    return this.db
      .insert(outfitItems)
      .values(items.map((i) => ({ outfitId, ...i })))
      .returning();
  }

  async findOutfitItems(outfitId: string) {
    const rows = await this.db
      .select({ item: outfitItems, clothingItem: clothingItems })
      .from(outfitItems)
      .leftJoin(clothingItems, eq(clothingItems.id, outfitItems.itemId))
      .where(eq(outfitItems.outfitId, outfitId))
      .orderBy(outfitItems.position);

    return rows.map(({ item, clothingItem }) => ({ ...item, item: clothingItem }));
  }

  async findItemsForGeneration(userId: string, limit: number) {
    return this.db
      .select()
      .from(clothingItems)
      .where(
        and(
          eq(clothingItems.userId, userId),
          eq(clothingItems.status, "active"),
          sql`${clothingItems.aiStatus} = 'completed'`
        )
      )
      .orderBy(desc(clothingItems.createdAt))
      .limit(limit);
  }

  async findRecentWear(userId: string, limit: number) {
    return this.db
      .select()
      .from(wearLog)
      .where(eq(wearLog.userId, userId))
      .orderBy(desc(wearLog.wornAt))
      .limit(limit);
  }

  async updateOutfitStatus(outfitId: string, status: string) {
    const rows = await this.db
      .update(outfits)
      .set({ status, updatedAt: new Date() })
      .where(eq(outfits.id, outfitId))
      .returning();
    return rows[0] ?? null;
  }

  async insertWearLog(userId: string, input: RecordWearInput) {
    const [wearLogRow] = await this.db
      .insert(wearLog)
      .values({
        userId,
        outfitId: input.outfitId ?? null,
        wornAt: input.wornAt ?? new Date(),
        occasion: input.occasion ?? null,
        weather: input.weather,
        source: input.source ?? "outfit",
      })
      .returning();

    const log = wearLogRow!;
    if (input.itemIds.length > 0) {
      await this.db.insert(wearLogItems).values(
        input.itemIds.map((itemId, index) => ({
          wearLogId: log.id,
          itemId,
          position: index,
        }))
      );
    }
    return log;
  }
  async insertFeedback(userId: string, input: RecordFeedbackInput & RecordSwapInput, action: string) {
    const rows = await this.db
      .insert(outfitFeedback)
      .values({
        userId,
        outfitId: input.outfitId ?? null,
        action,
        swapOutItemId: input.swapOutItemId ?? null,
        swapInItemId: input.swapInItemId ?? null,
        rating: input.rating ?? null,
        feedbackTags: input.feedbackTags ?? null,
        notes: input.notes ?? null,
        context: input.context,
      })
      .returning();
    return rows[0]!;
  }

  async bumpItemWearCounters(itemIds: string[], wornAt: Date) {
    if (itemIds.length === 0) {
      return;
    }
    for (const itemId of itemIds) {
      await this.db
        .update(clothingItems)
        .set({
          wearCount: sql`${clothingItems.wearCount} + 1`,
          lastWorn: wornAt,
          updatedAt: new Date(),
        })
        .where(eq(clothingItems.id, itemId));
    }
  }
}
