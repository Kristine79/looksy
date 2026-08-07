import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import { clothingItems, itemPhotos } from "./schema";
import type { Color, ItemMetadata } from "./schema";
import type {
  AddToWardrobeInput,
  UpdateClothingMetadataInput,
  WardrobeQuery,
} from "./types";

export type DbClient = PostgresJsDatabase<typeof schema>;

export class ClosetRepository {
  constructor(private readonly db: DbClient) {}

  async insertItem(userId: string, input: AddToWardrobeInput) {
    const rows = await this.db
      .insert(clothingItems)
      .values({
        userId,
        ...input,
        colors: input.colors ?? [],
        seasons: input.seasons ?? [],
        formality: input.formality ?? 3,
        condition: input.condition ?? "good",
      })
      .returning();
    return rows[0]!;
  }

  async findItemById(itemId: string) {
    const rows = await this.db
      .select()
      .from(clothingItems)
      .where(eq(clothingItems.id, itemId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findItems(userId: string, query: WardrobeQuery = {}) {
    const conditions = [eq(clothingItems.userId, userId)];
    if (query.status) {
      conditions.push(eq(clothingItems.status, query.status));
    }
    if (query.type) {
      conditions.push(eq(clothingItems.type, query.type));
    }

    return this.db
      .select()
      .from(clothingItems)
      .where(and(...conditions))
      .orderBy(desc(clothingItems.createdAt))
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);
  }

  async findItemsWithPhotos(userId: string, query: WardrobeQuery = {}) {
    const items = await this.findItems(userId, query);
    if (items.length === 0) {
      return [];
    }

    const photos = await this.findPhotosByItemIds(items.map((i) => i.id));
    const photosByItem = new Map<string, typeof photos>();
    for (const photo of photos) {
      const list = photosByItem.get(photo.itemId) ?? [];
      list.push(photo);
      photosByItem.set(photo.itemId, list);
    }

    return items.map((item) => ({
      ...item,
      photos: photosByItem.get(item.id) ?? [],
    }));
  }

  async findPhotosByItemIds(itemIds: string[]) {
    if (itemIds.length === 0) {
      return [];
    }
    return this.db
      .select()
      .from(itemPhotos)
      .where(sql`${itemPhotos.itemId} in ${itemIds}`)
      .orderBy(asc(itemPhotos.sortOrder));
  }

  async insertPhoto(
    itemId: string,
    input: {
      url: string;
      thumbnailUrl?: string | null;
      storagePath?: string | null;
      isPrimary?: boolean;
      sortOrder?: number;
      metadata?: { width?: number; height?: number; sizeBytes?: number } | null;
    }
  ) {
    const rows = await this.db
      .insert(itemPhotos)
      .values({
        itemId,
        url: input.url,
        thumbnailUrl: input.thumbnailUrl ?? null,
        storagePath: input.storagePath ?? null,
        isPrimary: input.isPrimary ?? false,
        sortOrder: input.sortOrder ?? 0,
        metadata: input.metadata ?? null,
      })
      .returning();
    return rows[0]!;
  }

  async updateItem(itemId: string, input: UpdateClothingMetadataInput) {
    const rows = await this.db
      .update(clothingItems)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(clothingItems.id, itemId))
      .returning();
    return rows[0] ?? null;
  }

  async updateStatus(itemId: string, status: string) {
    const rows = await this.db
      .update(clothingItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(clothingItems.id, itemId))
      .returning();
    return rows[0] ?? null;
  }

  async updateAiMetadata(
    itemId: string,
    input: Partial<{
      type: string;
      subType: string | null;
      material: string | null;
      pattern: string | null;
      colors: Color[];
      seasons: string[];
      formality: number;
      aiStatus: string;
      aiConfidence: number | null;
      aiModelVersion: string | null;
      aiPayload: Record<string, unknown> | null;
      aiError: string | null;
      aiProcessedAt: Date | null;
      metadata: ItemMetadata | null;
    }>
  ) {
    const rows = await this.db
      .update(clothingItems)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(clothingItems.id, itemId))
      .returning();
    return rows[0] ?? null;
  }
}
