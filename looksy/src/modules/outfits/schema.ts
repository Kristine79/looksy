import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "@/lib/db/uuidv7";
import { users } from "@/modules/users/schema";
import { clothingItems } from "@/modules/closet/schema";

export interface WeatherSnapshot {
  tempC?: number;
  condition?: string;
  humidity?: number;
  windKph?: number;
  uvIndex?: number;
  [key: string]: unknown;
}

export interface OutfitScores {
  colorHarmony?: number;
  styleCoherence?: number;
  weatherFit?: number;
  rotationScore?: number;
  total?: number;
}

export interface EvidenceItem {
  type: string;
  text: string;
  source: string;
  confidence?: number;
}

export interface GenerationContext {
  candidatesCount?: number;
  model?: string;
  promptVersion?: string;
  [key: string]: unknown;
}

export type OutfitSource = "ai" | "manual";

export type OutfitStatus = "generated" | "saved" | "archived" | "dismissed";

export const outfits = pgTable(
  "outfits",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    source: varchar("source", { length: 20 }).notNull().default("ai"),
    status: varchar("status", { length: 20 }).notNull().default("generated"),
    occasion: varchar("occasion", { length: 50 }),
    mood: varchar("mood", { length: 50 }),
    weather: jsonb("weather").$type<WeatherSnapshot>(),
    explanation: text("explanation"),
    scores: jsonb("scores").$type<OutfitScores>(),
    evidence: jsonb("evidence").$type<EvidenceItem[]>(),
    generationContext: jsonb("generation_context").$type<GenerationContext>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_outfits_user_created").on(table.userId, table.createdAt.desc()),
    index("idx_outfits_user_status").on(table.userId, table.status),
  ],
);

export const outfitItems = pgTable(
  "outfit_items",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfits.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => clothingItems.id, { onDelete: "cascade" }),
    position: smallint("position").notNull().default(0),
  },
  (table) => [
    index("idx_outfit_items_outfit_pos").on(table.outfitId, table.position),
    index("idx_outfit_items_item").on(table.itemId),
  ],
);

export const wearLog = pgTable(
  "wear_log",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outfitId: uuid("outfit_id").references(() => outfits.id, { onDelete: "set null" }),
    wornAt: timestamp("worn_at", { withTimezone: true }).defaultNow().notNull(),
    occasion: varchar("occasion", { length: 50 }),
    weather: jsonb("weather").$type<WeatherSnapshot>(),
    source: varchar("source", { length: 20 }).notNull().default("outfit"),
  },
  (table) => [index("idx_wear_log_user_worn").on(table.userId, table.wornAt.desc())],
);

export const wearLogItems = pgTable(
  "wear_log_items",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    wearLogId: uuid("wear_log_id")
      .notNull()
      .references(() => wearLog.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").references(() => clothingItems.id, { onDelete: "set null" }),
    position: smallint("position").notNull().default(0),
  },
  (table) => [
    index("idx_wear_log_items_log").on(table.wearLogId),
    index("idx_wear_log_items_item").on(table.itemId),
  ],
);

export type FeedbackAction = "wear" | "save" | "swap" | "skip";

export interface FeedbackContext {
  occasion?: string;
  weather?: WeatherSnapshot;
  [key: string]: unknown;
}

export const outfitFeedback = pgTable(
  "outfit_feedback",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outfitId: uuid("outfit_id").references(() => outfits.id, { onDelete: "set null" }),
    action: varchar("action", { length: 20 }).notNull(),
    swapOutItemId: uuid("swap_out_item_id").references(() => clothingItems.id, {
      onDelete: "set null",
    }),
    swapInItemId: uuid("swap_in_item_id").references(() => clothingItems.id, {
      onDelete: "set null",
    }),
    rating: smallint("rating"),
    feedbackTags: text("feedback_tags").array(),
    notes: text("notes"),
    context: jsonb("context").$type<FeedbackContext>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "chk_outfit_feedback_rating",
      sql`${table.rating} is null or ${table.rating} between 1 and 4`,
    ),
    index("idx_outfit_feedback_user_created").on(table.userId, table.createdAt.desc()),
    index("idx_outfit_feedback_outfit").on(table.outfitId),
    index("idx_outfit_feedback_action").on(table.action),
    index("idx_outfit_feedback_swap_out").on(table.swapOutItemId),
    index("idx_outfit_feedback_swap_in").on(table.swapInItemId),
  ],
);
