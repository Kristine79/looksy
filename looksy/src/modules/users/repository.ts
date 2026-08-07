import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { users, userPreferences } from "./schema";
import type * as schema from "@/lib/db/schema";
import type {
  CreateUserInput,
  UpdatePreferencesInput,
  UpdateUserInput,
} from "./types";

export type DbClient = PostgresJsDatabase<typeof schema>;

export class UsersRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string) {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByClerkId(clerkUserId: string) {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByEmail(email: string) {
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  }

  async create(input: CreateUserInput) {
    const rows = await this.db.insert(users).values(input).returning();
    return rows[0]!;
  }

  async update(id: string, input: UpdateUserInput) {
    const rows = await this.db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async findPreferences(userId: string) {
    const rows = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async upsertPreferences(userId: string, input: UpdatePreferencesInput) {
    const rows = await this.db
      .insert(userPreferences)
      .values({ userId, ...input })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    return rows[0]!;
  }
}
