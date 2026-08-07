import { NotFoundError } from "@/lib/errors";
import { UsersRepository } from "./repository";
import type {
  CreateUserInput,
  UpdatePreferencesInput,
  UpdateUserInput,
  UserProfile,
} from "./types";

export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    const preferences = await this.repository.findPreferences(user.id);
    return { user, preferences };
  }

  async getProfileByClerkId(clerkUserId: string): Promise<UserProfile | null> {
    const user = await this.repository.findByClerkId(clerkUserId);
    if (!user) {
      return null;
    }
    const preferences = await this.repository.findPreferences(user.id);
    return { user, preferences };
  }

  async createProfile(input: CreateUserInput): Promise<UserProfile> {
    const user = await this.repository.create(input);
    const preferences = await this.repository.upsertPreferences(user.id, {});
    return { user, preferences };
  }

  async updateProfile(userId: string, input: UpdateUserInput) {
    const user = await this.repository.update(userId, input);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    return user;
  }

  async getStylePreferences(userId: string) {
    const preferences = await this.repository.findPreferences(userId);
    return preferences?.stylePreferences ?? null;
  }

  async updatePreferences(userId: string, input: UpdatePreferencesInput) {
    return this.repository.upsertPreferences(userId, input);
  }
}
