import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { uuidv7 } from "@/lib/db/uuidv7";
import { users } from "@/modules/users/schema";

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    eventName: varchar("event_name", { length: 100 }).notNull(),
    properties: jsonb("properties").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_analytics_events_name_created").on(table.eventName, table.createdAt.desc()),
    index("idx_analytics_events_user_created").on(table.userId, table.createdAt.desc()),
  ],
);
