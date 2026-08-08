import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import { clothingItems } from "@/modules/closet/schema";
import { outfitFeedback, outfits, wearLog } from "@/modules/outfits/schema";
import { fashionMemories, memoryEvidence, userStyleProfiles } from "./schema";
import type { CreateMemoryInput, EvidenceInput, MemoryQuery } from "./types";

export type DbClient = PostgresJsDatabase<typeof schema>;

/**
 * Statuses that are excluded from the active recommendation context.
 * `deleted` = user-rejected (ADR-018 soft delete); `fading`/`dormant` = decayed
 * below an impactful confidence (ADR-014). Keeping them out of the active
 * boundary means the recommendation prompt only sees current preferences.
 * Exported as a plain array so the filter rule is testable without a database.
 */
export const INACTIVE_MEMORY_STATUSES = ["deleted", "fading", "dormant"] as const;

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

  /**
   * Finds existing memories for a user that share the same (type, category) key.
   * Used by MemoryAutomationService to prevent duplicate memories — the same
   * semantic pattern ("prefers navy" / "likes navy" / "often chooses navy")
   * must accumulate as evidence on one canonical memory, not three rows.
   * Returns all statuses (including `deleted`, so the automation can detect
   * user-rejected patterns and avoid recreating them).
   */
  async findMemoryByTypeCategory(userId: string, type: string, category: string) {
    return this.db
      .select()
      .from(fashionMemories)
      .where(
        and(
          eq(fashionMemories.userId, userId),
          eq(fashionMemories.type, type),
          eq(fashionMemories.category, category),
        ),
      )
      .orderBy(desc(fashionMemories.updatedAt));
  }

  /**
   * Loads all non-deleted memories for a user with their evidence — the inputs
   * to a decay pass (time-based confidence recompute). Sorted by updatedAt so
   * recent signals are evaluated first; matches the index order in `findMemories`.
   */
  async findMemoriesForDecay(userId: string) {
    const memories = await this.db
      .select()
      .from(fashionMemories)
      .where(
        and(
          eq(fashionMemories.userId, userId),
          sql`${fashionMemories.status} <> 'deleted'`,
        ),
      )
      .orderBy(desc(fashionMemories.updatedAt));

    if (memories.length === 0) {
      return [];
    }
    const ids = memories.map((m) => m.id);
    const evidenceRows = await this.db
      .select()
      .from(memoryEvidence)
      .where(inArray(memoryEvidence.memoryId, ids))
      .orderBy(asc(memoryEvidence.createdAt));

    const byMemory = new Map<string, typeof evidenceRows>();
    for (const row of evidenceRows) {
      const list = byMemory.get(row.memoryId) ?? [];
      list.push(row);
      byMemory.set(row.memoryId, list);
    }
    return memories.map((memory) => ({
      memory,
      evidence: byMemory.get(memory.id) ?? [],
    }));
  }

  /**
   * Finds a positive-form memory (color/style/context preference) whose category
   * carries the given tag. Used by MemoryAutomationService to resolve negative
   * signals (e.g. repeated skips of "formal" outfits) against existing positive
   * preferences — the two must conflict on the same memory instead of spawning
   * a contradictory duplicate.
   */
  async findPositiveMemoryByTag(userId: string, tag: string) {
    const categories = [`style:${tag}`, `color:${tag}`, `context:${tag}`];
    const rows = await this.db
      .select()
      .from(fashionMemories)
      .where(
        and(
          eq(fashionMemories.userId, userId),
          sql`${fashionMemories.status} <> 'deleted'`,
          inArray(fashionMemories.category, categories),
        ),
      )
      .orderBy(desc(fashionMemories.confidence))
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

  /**
   * Returns the user's active recommendation memories ordered by confidence —
   * used by the RecommendationContextService to populate the prompt without
   * leaking:
   *   - user-rejected (`deleted`) preferences (ADR-018 soft-delete boundary), and
   *   - `fading` / `dormant` memories that no longer carry enough confidence to
   *     influence a recommendation (their status already reflects staleness
   *     from the decay pass; keeping them out of the active context keeps the
   *     prompt focused on current style).
   */
  async findActiveMemories(userId: string, limit: number) {
    return this.db
      .select()
      .from(fashionMemories)
      .where(
        and(
          eq(fashionMemories.userId, userId),
          ...INACTIVE_MEMORY_STATUSES.map(
            (status) => sql`${fashionMemories.status} <> ${status}`,
          ),
        ),
      )
      .orderBy(desc(fashionMemories.confidence))
      .limit(limit);
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
      .select({
        id: outfitFeedback.id,
        action: outfitFeedback.action,
        rating: outfitFeedback.rating,
        outfitId: outfitFeedback.outfitId,
        context: outfitFeedback.context,
        createdAt: outfitFeedback.createdAt,
      })
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
