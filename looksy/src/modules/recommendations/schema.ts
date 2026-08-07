import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "@/lib/db/uuidv7";
import { users } from "@/modules/users/schema";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/modules/ai/schema";

export type MemoryType =
  | "color_preference"
  | "style_tendency"
  | "context_preference"
  | "negative_preference"
  | "brand_preference"
  | "successful_combination"
  | "rejected_combination";

export type MemoryStatus =
  | "emerging"
  | "possible"
  | "confirmed"
  | "fading"
  | "dormant"
  | "deleted";

export type MemorySource = "explicit" | "behavioral" | "contextual";

export const fashionMemories = pgTable(
  "fashion_memories",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description").notNull(),
    confidence: real("confidence").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default("emerging"),
    dataPoints: integer("data_points").notNull().default(0),
    consistency: real("consistency").notNull().default(0),
    source: varchar("source", { length: 20 }).notNull().default("behavioral"),
    lastSignalAt: timestamp("last_signal_at", { withTimezone: true }),
    lastConfirmed: timestamp("last_confirmed", { withTimezone: true }),
    lastInfluenced: timestamp("last_influenced", { withTimezone: true }),
    userConfirmedAt: timestamp("user_confirmed_at", { withTimezone: true }),
    userCorrectedAt: timestamp("user_corrected_at", { withTimezone: true }),
    correctionText: text("correction_text"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "chk_fashion_memories_confidence",
      sql`${table.confidence} between 0 and 1`,
    ),
    check(
      "chk_fashion_memories_consistency",
      sql`${table.consistency} between 0 and 1`,
    ),
    index("idx_fashion_memories_user_status").on(table.userId, table.status),
    index("idx_fashion_memories_user_type").on(table.userId, table.type),
    index("idx_fashion_memories_user_status_conf").on(
      table.userId,
      table.status,
      table.confidence.desc(),
    ),
  ],
);

export type EvidenceType =
  | "worn_frequency"
  | "saved_preference"
  | "style_pattern"
  | "weather"
  | "rotation"
  | "color_harmony"
  | "negative"
  | "user_edit"
  | "outfit_feedback";

export type EvidenceSourceType = "wear_log" | "outfit_feedback" | "outfit" | "item" | "user_edit";

export interface MemoryEvidenceData {
  count?: number;
  days?: number;
  itemIds?: string[];
  [key: string]: unknown;
}

export const memoryEvidence = pgTable(
  "memory_evidence",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    memoryId: uuid("memory_id")
      .notNull()
      .references(() => fashionMemories.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    text: text("text").notNull(),
    sourceType: varchar("source_type", { length: 30 }).notNull(),
    sourceId: uuid("source_id"),
    data: jsonb("data").$type<MemoryEvidenceData>(),
    confidence: real("confidence"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "chk_memory_evidence_confidence",
      sql`${table.confidence} is null or ${table.confidence} between 0 and 1`,
    ),
    index("idx_memory_evidence_memory").on(table.memoryId, table.createdAt),
  ],
);

export interface StyleDna {
  primaryDirection?: string;
  colors?: Array<{ name: string; share: number }>;
  silhouette?: string;
  fabrics?: string[];
  formalityByOccasion?: Record<string, number>;
  styleWords?: string[];
  paletteTemperature?: string;
  [key: string]: unknown;
}

export const userStyleProfiles = pgTable("user_style_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  styleVec: vector("style_vec", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
  dna: jsonb("dna").$type<StyleDna>(),
  itemsAnalyzed: integer("items_analyzed").notNull().default(0),
  outfitsAnalyzed: integer("outfits_analyzed").notNull().default(0),
  model: varchar("model", { length: 100 }).notNull().default(EMBEDDING_MODEL),
  computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
