import {
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "@/lib/db/uuidv7";
import { users } from "@/modules/users/schema";
import { clothingItems } from "@/modules/closet/schema";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export const itemEmbeddings = pgTable(
  "item_embeddings",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    itemId: uuid("item_id")
      .notNull()
      .references(() => clothingItems.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    textRepr: text("text_repr"),
    model: varchar("model", { length: 100 }).notNull().default(EMBEDDING_MODEL),
    dimension: smallint("dimension").notNull().default(EMBEDDING_DIMENSIONS),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_item_embeddings_item_model").on(table.itemId, table.model),
    index("idx_item_embeddings_user").on(table.userId),
    index("idx_item_embeddings_vec").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);
