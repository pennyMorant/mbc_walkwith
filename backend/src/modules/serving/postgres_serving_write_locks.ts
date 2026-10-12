import { sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";

type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export async function lockServingWriters(
  transaction: AppTransaction,
  scope: "assignment" | "assignment_record" | "availability" | "role",
  resourceIds: string[]
) {
  const lockKeys = [...new Set(resourceIds)]
    .map((resourceId) => `serving:${scope}:${resourceId}`)
    .sort();
  for (const lockKey of lockKeys) {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`
    );
  }
}
