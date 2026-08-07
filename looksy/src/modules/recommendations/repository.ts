import { and, asc, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import { clothingItems } from "@/modules/closet/schema";
import { outfitFeedback, outfits, wearLog } from "@/modules/outfits/schema";
import { fashionMemories, memoryEvidence, userStyleProfiles } from "./schema";
import type { CreateMemoryInput, EvidenceInput, MemoryQuery } from "./types";

export type DbClient = PostgresJsDatabase<typeof schema>;

export class MemoriesRepository {
  constructor(private readonly db: DbClient) {}

  async insertMemory(userId: string, input: CreateMemoryInput) {
    const rows = await this.db
      .insert(fashionMemories)
      .values({
        userId,
        type: input.type,
        category: input.category,
        description: input.description,
        confidence: input.confidence ?? 0.5,
        source: input.source ?? "behavioral",
        dataPoints: input.dataPoints ?? 0,
        status: "emerging",
      })
      .returning();
    return rows[0]!;
  }

  async findMemoryById(memoryId: string) {
    const rows = await this.db
      .select()
      .from(fashionMemories)
      .where(eq(fashionMemories.id, memoryId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findMemories(userId: string, query: MemoryQuery = {}) {
    const conditions = [eq(fashionMemories.userId, userId)];
    if (query.status) {
      conditions.push(eq(fashionMemories.status, query.status));
    }
    if (query.type) {
      conditions.push(eq(fashionMemories.type, query.type));
    }

    return this.db
      .select()
      .from(fashionMemories)
      .where(and(...conditions))
      .orderBy(desc(fashionMemories.confidence))
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);
  }

  async insertEvidence(memoryId: string, input: EvidenceInput) {
    const rows = await this.db
      .insert(memoryEvidence)
      .values({
        memoryId,
        type: input.type,
        text: input.text,
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        data: input.data,
        confidence: input.confidence ?? null,
      })
      .returning();
    return rows[0]!;
  }

  async findEvidence(memoryId: string) {
    return this.db
      .select()
      .from(memoryEvidence)
      .where(eq(memoryEvidence.memoryId, memoryId))
      .orderBy(asc(memoryEvidence.createdAt));
  }

  async updateMemory(memoryId: string, patch: Partial<typeof fashionMemories.$inferInsert>) {
    const rows = await this.db
      .update(fashionMemories)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(fashionMemories.id, memoryId))
      .returning();
    return rows[0] ?? null;
  }

  async findStyleProfile(userId: string) {
    const rows = await this.db
      .select()
      .from(userStyleProfiles)
      .where(eq(userStyleProfiles.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findUserFeedback(userId: string, limit: number) {
    return this.db
      .select({ action: outfitFeedback.action, rating: outfitFeedback.rating, createdAt: outfitFeedback.createdAt })
      .from(outfitFeedback)
      .where(eq(outfitFeedback.userId, userId))
      .orderBy(desc(outfitFeedback.createdAt))
      .limit(limit);
  }

  async findItems(userId: string, limit: number) {
    return this.db
      .select()
      .from(clothingItems)
      .where(and(eq(clothingItems.userId, userId), eq(clothingItems.status, "active")))
      .orderBy(desc(clothingItems.createdAt))
      .limit(limit);
  }

  async findOutfits(userId: string, limit: number) {
    return this.db
      .select()
      .from(outfits)
      .where(eq(outfits.userId, userId))
      .orderBy(desc(outfits.createdAt))
      .limit(limit);
  }

  async findWearHistory(userId: string, limit: number) {
    return this.db
      .select()
      .from(wearLog)
      .where(eq(wearLog.userId, userId))
      .orderBy(desc(wearLog.wornAt))
      .limit(limit);
  }
}
