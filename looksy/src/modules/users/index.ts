// Users module — public API
export { users, userPreferences } from "./schema";
export type {
  NotificationSettings,
  StylePreferences,
  UserLocation,
} from "./schema";
export { UsersRepository } from "./repository";
export { UsersService } from "./service";
export type {
  CreateUserInput,
  UpdatePreferencesInput,
  UpdateUserInput,
  UserPreferencesRow,
  UserProfile,
  UserRow,
} from "./types";
