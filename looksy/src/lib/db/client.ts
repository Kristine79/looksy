import { loadEnvFile } from "node:process";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  try {
    loadEnvFile(".env.local");
  } catch {
    try {
      loadEnvFile(".env");
    } catch {
      // env files are optional — DATABASE_URL may come from the environment
    }
  }
}

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
