import { analyticsEvents } from "./schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";

export type DbClient = PostgresJsDatabase<typeof schema>;

export class AnalyticsRepository {
  constructor(private readonly db: DbClient) {}

  async insertEvent(
    userId: string | null,
    eventName: string,
    properties: Record<string, unknown> = {}
  ) {
    const rows = await this.db
      .insert(analyticsEvents)
      .values({ userId, eventName, properties })
      .returning();
    return rows[0]!;
  }
}
