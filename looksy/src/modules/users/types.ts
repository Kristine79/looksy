import type { users, userPreferences } from "./schema";
import type {
  NotificationSettings,
  StylePreferences,
  UserLocation,
} from "./schema";

export type UserRow = typeof users.$inferSelect;
export type UserPreferencesRow = typeof userPreferences.$inferSelect;

export interface UserProfile {
  user: UserRow;
  preferences: UserPreferencesRow | null;
}

export interface CreateUserInput {
  clerkUserId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  location?: UserLocation | null;
}

export interface UpdateUserInput {
  name?: string | null;
  avatarUrl?: string | null;
  location?: UserLocation | null;
}

export interface UpdatePreferencesInput {
  stylePreferences?: StylePreferences;
  notificationSettings?: NotificationSettings;
  quizCompleted?: boolean;
}
