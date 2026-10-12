import type { SermonProgress } from "@mbc/api-contracts";
import { and, eq } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { sermonPlaybackProgress } from "../../shared/db/schema.js";
import type {
  SaveSermonProgressInput,
  SermonProgressRepository,
  SermonProgressViewer
} from "./sermon_progress.repository.js";

export class PostgresSermonProgressRepository
  implements SermonProgressRepository
{
  constructor(private readonly db: AppDb) {}

  async get(
    sermonId: string,
    viewer: SermonProgressViewer
  ): Promise<SermonProgress | null> {
    const [row] = await this.db
      .select()
      .from(sermonPlaybackProgress)
      .where(
        and(
          eq(sermonPlaybackProgress.sermonId, sermonId),
          eq(sermonPlaybackProgress.userType, viewer.userType),
          eq(sermonPlaybackProgress.userId, viewer.userId)
        )
      )
      .limit(1);
    return row ? toProgress(row) : null;
  }

  async upsert(input: SaveSermonProgressInput): Promise<SermonProgress> {
    const now = new Date();
    const [row] = await this.db
      .insert(sermonPlaybackProgress)
      .values({
        sermonId: input.sermonId,
        userType: input.viewer.userType,
        userId: input.viewer.userId,
        positionSeconds: input.positionSeconds,
        completed: input.completed,
        completedAt: input.completedAt,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [
          sermonPlaybackProgress.sermonId,
          sermonPlaybackProgress.userType,
          sermonPlaybackProgress.userId
        ],
        set: {
          positionSeconds: input.positionSeconds,
          completed: input.completed,
          completedAt: input.completedAt,
          updatedAt: now
        }
      })
      .returning();
    if (!row) {
      throw new Error("Failed to save sermon playback progress.");
    }
    return toProgress(row);
  }
}

type SermonProgressRow = typeof sermonPlaybackProgress.$inferSelect;

function toProgress(row: SermonProgressRow): SermonProgress {
  return {
    sermonId: row.sermonId,
    positionSeconds: row.positionSeconds,
    completed: row.completed,
    completedAt: row.completedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString()
  };
}
