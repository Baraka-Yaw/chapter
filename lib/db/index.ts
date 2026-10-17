import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

// One client per server instance; reused across hot reloads in development.
const globalForDb = globalThis as unknown as { chapterOSql?: ReturnType<typeof postgres> };

function client() {
  if (!globalForDb.chapterOSql) {
    // `prepare: false` keeps it compatible with Neon's pooled (PgBouncer) connection string.
    globalForDb.chapterOSql = postgres(env().DATABASE_URL, { max: 5, prepare: false });
  }
  return globalForDb.chapterOSql;
}

export const db = drizzle({ client: client(), schema, casing: "snake_case" });
export { schema };
