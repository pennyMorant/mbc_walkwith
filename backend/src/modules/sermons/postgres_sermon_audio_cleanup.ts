import type { SermonAudioCleanupReason } from "@mbc/api-contracts";
import { eq } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { sermonAudioCleanupTasks } from "../../shared/db/schema.js";

type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export function scheduleSermonAudioCleanup(
  transaction: AppTransaction,
  input: {
    sermonId: string;
    storagePath: string;
    reason: SermonAudioCleanupReason;
  }
) {
  return transaction
    .insert(sermonAudioCleanupTasks)
    .values(input)
    .onConflictDoNothing({ target: sermonAudioCleanupTasks.storagePath });
}

export function discardSermonAudioCleanupCandidate(
  transaction: AppTransaction,
  storagePath: string
) {
  return transaction
    .delete(sermonAudioCleanupTasks)
    .where(eq(sermonAudioCleanupTasks.storagePath, storagePath));
}
