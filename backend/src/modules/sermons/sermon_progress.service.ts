import type {
  SermonProgress,
  SermonProgressUpdateRequest
} from "@mbc/api-contracts";

import { sermonNotFound, sermonProgressIdentityRequired } from "./sermon-errors.js";
import type {
  SermonProgressRepository,
  SermonProgressViewer
} from "./sermon_progress.repository.js";
import type { SermonService } from "./sermon.service.js";

export class SermonProgressService {
  constructor(
    private readonly repository: SermonProgressRepository,
    private readonly sermonService: SermonService
  ) {}

  async get(
    sermonId: string,
    viewer: SermonProgressViewer | null
  ): Promise<SermonProgress | null> {
    const owner = requireViewer(viewer);
    await this.requirePublishedSermon(sermonId);
    return this.repository.get(sermonId, owner);
  }

  async save(
    sermonId: string,
    viewer: SermonProgressViewer | null,
    input: SermonProgressUpdateRequest
  ): Promise<SermonProgress> {
    const owner = requireViewer(viewer);
    const sermon = await this.requirePublishedSermon(sermonId);
    const durationSeconds = sermon.durationSeconds;
    const boundedPosition =
      durationSeconds > 0
        ? Math.min(input.positionSeconds, durationSeconds)
        : input.positionSeconds;
    const completed =
      input.completed ||
      (durationSeconds > 0 && boundedPosition >= durationSeconds - 15);
    const existing = await this.repository.get(sermonId, owner);
    const completedAt = completed
      ? existing?.completedAt
        ? new Date(existing.completedAt)
        : new Date()
      : null;

    return this.repository.upsert({
      sermonId,
      viewer: owner,
      positionSeconds:
        completed && durationSeconds > 0 ? durationSeconds : boundedPosition,
      completed,
      completedAt
    });
  }

  private async requirePublishedSermon(sermonId: string) {
    const sermon = await this.sermonService.getPublishedById(sermonId);
    if (!sermon) {
      throw sermonNotFound(sermonId);
    }
    return sermon;
  }
}

function requireViewer(
  viewer: SermonProgressViewer | null
): SermonProgressViewer {
  if (!viewer) {
    throw sermonProgressIdentityRequired();
  }
  return viewer;
}
