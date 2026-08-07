import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "@/lib/db/uuidv7";
import { users } from "@/modules/users/schema";

export interface Color {
  name: string;
  hex: string;
  dominance: number;
}

export interface ItemMetadata {
  fit?: string;
  silhouette?: string;
  layers?: string[];
  [key: string]: unknown;
}

export type ClothingItemStatus = "active" | "archived" | "donated";

export type AiStatus = "pending" | "processing" | "completed" | "needs_review" | "failed";

export const clothingItems = pgTable(
  "clothing_items",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    subType: varchar("sub_type", { length: 100 }),
    brand: varchar("brand", { length: 255 }),
    material: varchar("material", { length: 100 }),
    pattern: varchar("pattern", { length: 50 }),
    colors: jsonb("colors").$type<Color[]>().notNull().default([]),
    seasons: text("seasons").array().notNull().default([]),
    formality: smallint("formality").notNull().default(3),
    condition: varchar("condition", { length: 50 }).notNull().default("good"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    wearCount: integer("wear_count").notNull().default(0),
    lastWorn: timestamp("last_worn", { withTimezone: true }),
    notes: text("notes"),
    aiStatus: varchar("ai_status", { length: 20 }).notNull().default("pending"),
    aiConfidence: real("ai_confidence"),
    aiModelVersion: varchar("ai_model_version", { length: 100 }),
    aiPayload: jsonb("ai_payload").$type<unknown>(),
    aiError: text("ai_error"),
    aiProcessedAt: timestamp("ai_processed_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<ItemMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("chk_clothing_items_formality", sql`${table.formality} between 1 and 5`),
    check(
      "chk_clothing_items_ai_confidence",
      sql`${table.aiConfidence} is null or ${table.aiConfidence} between 0 and 1`,
    ),
    index("idx_clothing_items_user_status").on(table.userId, table.status),
    index("idx_clothing_items_user_type").on(table.userId, table.type),
    index("idx_clothing_items_user_created").on(table.userId, table.createdAt.desc()),
    index("idx_clothing_items_seasons").using("gin", table.seasons),
    index("idx_clothing_items_ai_pending")
      .on(table.aiStatus)
      .where(sql`${table.aiStatus} in ('pending', 'processing')`),
  ],
);

export const itemPhotos = pgTable(
  "item_photos",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    itemId: uuid("item_id")
      .notNull()
      .references(() => clothingItems.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 2048 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 2048 }),
    storagePath: text("storage_path"),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: smallint("sort_order").notNull().default(0),
    metadata: jsonb("metadata").$type<{ width?: number; height?: number; sizeBytes?: number }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_item_photos_item_sort").on(table.itemId, table.sortOrder),
    uniqueIndex("uq_item_photos_primary").on(table.itemId).where(sql`${table.isPrimary} = true`),
  ],
);
