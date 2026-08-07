import {
  boolean,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "@/lib/db/uuidv7";

export interface UserLocation {
  city: string;
  lat: number;
  lon: number;
}

export interface StylePreferences {
  aesthetics: string[];
  formality: number;
  colors: string[];
  brands: string[];
  silhouette?: string;
  fit?: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const users = pgTable("users", {
  id: uuid("id").primaryKey().$defaultFn(uuidv7),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 2048 }),
  location: jsonb("location").$type<UserLocation>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  stylePreferences: jsonb("style_preferences").$type<StylePreferences>(),
  notificationSettings: jsonb("notification_settings")
    .$type<NotificationSettings>()
    .default({
      pushEnabled: true,
      emailEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    }),
  quizCompleted: boolean("quiz_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
