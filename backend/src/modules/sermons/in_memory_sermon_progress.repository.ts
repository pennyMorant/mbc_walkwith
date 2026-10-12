import type { SermonProgress } from "@mbc/api-contracts";

import type {
  SaveSermonProgressInput,
  SermonProgressRepository,
  SermonProgressViewer
} from "./sermon_progress.repository.js";

export class InMemorySermonProgressRepository
  implements SermonProgressRepository
{
  private readonly progress = new Map<string, SermonProgress>();

  async get(
    sermonId: string,
    viewer: SermonProgressViewer
  ): Promise<SermonProgress | null> {
    return this.progress.get(progressKey(sermonId, viewer)) ?? null;
  }

  async upsert(input: SaveSermonProgressInput): Promise<SermonProgress> {
    const progress: SermonProgress = {
      sermonId: input.sermonId,
      positionSeconds: input.positionSeconds,
      completed: input.completed,
      completedAt: input.completedAt?.toISOString() ?? null,
      updatedAt: new Date().toISOString()
    };
    this.progress.set(progressKey(input.sermonId, input.viewer), progress);
    return progress;
  }
}

function progressKey(sermonId: string, viewer: SermonProgressViewer): string {
  return `${viewer.userType}:${viewer.userId}:${sermonId}`;
}
