import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { AppConfig } from "../../config/env.js";
import * as schema from "./schema.js";

export function createDb(config: AppConfig) {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required for Postgres mode.");
  }

  return createDbFromConnectionString(config.databaseUrl);
}

export function createDbFromConnectionString(connectionString: string) {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export function createManagedDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return {
    db: drizzle(pool, { schema }),
    close: () => pool.end()
  };
}

export type AppDb = ReturnType<typeof createDb>;
