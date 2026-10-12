import type {
  CreateLocalSermonDraftRequest,
  LocalSermonPackageRequest,
  PublicSermon,
  SermonListQuery,
  SermonRecommendationQuery,
  Sermon,
  SermonStatus,
  UpdateSermonRequest
} from "@mbc/api-contracts";
import { publicSermonSchema } from "@mbc/api-contracts";

import { isAppError } from "../../shared/http/app-error.js";
import {
  publishedSermonAssetLocked,
  sermonStateChanged,
  uploadFailed
} from "./sermon-errors.js";
import {
  assertSermonMutationAllowed,
  validateSermonMutation
} from "./sermon_publish_policy.js";
import type { SermonMutationContext } from "./sermon_publish_policy.js";
import type { SermonRepository } from "./sermon.repository.js";
import type { SermonAudioStorageService } from "./sermon-audio-storage.service.js";
import type { SermonAudioCleanupService } from "./sermon_audio_cleanup.service.js";

export type { SermonMutationContext } from "./sermon_publish_policy.js";

export class SermonService {
  constructor(
    private readonly repository: SermonRepository,
    private readonly audioStorageService: SermonAudioStorageService,
    private readonly audioCleanupService: SermonAudioCleanupService
  ) {}

  list(query: SermonListQuery) {
    return this.repository.list(query);
  }

  countByStatus(status: SermonStatus) {
    return this.repository.countByStatus(status);
  }

  async listPublished(query: SermonListQuery) {
    const result = await this.repository.list({
      ...query,
      status: "published"
    });
    return {
      sermons: result.sermons.map(toPublicSermon),
      nextCursor: result.nextCursor
    };
  }

  recommendations(query: SermonRecommendationQuery) {
    return this.repository.recommendations(query);
  }

  discoveryFacets() {
    return this.repository.discoveryFacets();
  }

  async publishedRecommendations(query: SermonRecommendationQuery) {
    const sermons = await this.repository.recommendations(query);
    return sermons.map(toPublicSermon);
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  async getPublishedById(id: string): Promise<PublicSermon | null> {
    const sermon = await this.repository.getById(id);
    return sermon?.status === "published" ? toPublicSermon(sermon) : null;
  }

  createDraft(input: CreateLocalSermonDraftRequest) {
    return this.repository.createDraft(input);
  }

  async update(
    id: string,
    input: UpdateSermonRequest,
    context: SermonMutationContext
  ) {
    const existing = await this.repository.getById(id);
    if (!existing) {
      return null;
    }
    assertExpectedRevision(existing, context.expectedRevision);
    validateSermonMutation(existing, input, context);
    const updated = await this.repository.update(id, input, {
      expectedRevision: context.expectedRevision
    });
    if (updated) {
      return updated;
    }
    const current = await this.repository.getById(id);
    if (!current) {
      return null;
    }
    validateSermonMutation(current, input, context);
    throw sermonStateChanged(id);
  }

  async publish(
    id: string,
    context: SermonMutationContext
  ) {
    return this.update(id, { status: "published" }, context);
  }

  async importLocalPackage(
    id: string,
    input: LocalSermonPackageRequest,
    context: SermonMutationContext
  ) {
    return this.update(
      id,
      {
        ...(input.title ? { title: input.title } : {}),
        ...(input.speaker ? { speaker: input.speaker } : {}),
        ...(input.sermonDate ? { sermonDate: input.sermonDate } : {}),
        ...(input.series !== undefined ? { series: input.series } : {}),
        ...(input.topics !== undefined ? { topics: input.topics } : {}),
        ...(input.primaryReference !== undefined
          ? { primaryReference: input.primaryReference }
          : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.durationSeconds !== undefined
          ? { durationSeconds: input.durationSeconds }
          : {}),
        transcript: input.transcript,
        outline: input.outline,
        references: input.references,
        ...(input.reviewMarkdown !== undefined
          ? { reviewMarkdown: input.reviewMarkdown }
          : {}),
        processingMetadata: input.processingMetadata,
        ...(input.submitForReview ? { status: "needs_review" as const } : {})
      },
      context
    );
  }

  async attachAudio(
    id: string,
    input: { buffer: Buffer; fileName: string; mimeType: string },
    context: SermonMutationContext
  ) {
    const existing = await this.repository.getById(id);
    if (!existing) {
      return null;
    }
    assertExpectedRevision(existing, context.expectedRevision);
    assertSermonMutationAllowed(existing, existing.status, context);
    const existingAudio = await this.repository.getAudioRecord(id);
    const stored = await this.audioStorageService
      .saveAudio({
        sermonId: id,
        buffer: input.buffer,
        fileName: input.fileName,
        mimeType: input.mimeType
      })
      .catch((error: unknown) => {
        if (isAppError(error) && error.code === "object_upload_failed") {
          throw uploadFailed(id, error.message);
        }
        throw error;
      });
    try {
      await this.audioCleanupService.schedule({
        sermonId: id,
        storagePath: stored.storagePath,
        reason: "unbound_upload"
      });
    } catch (error) {
      await this.audioStorageService.deleteAudio(stored.storagePath);
      throw error;
    }
    const updated = await this.repository.attachAudio(id, stored, {
      expectedRevision: context.expectedRevision,
      audioCleanupCandidateStoragePath: stored.storagePath,
      ...(existingAudio?.storagePath &&
      existingAudio.storagePath !== stored.storagePath
        ? {
            audioCleanup: {
              storagePath: existingAudio.storagePath,
              reason: "audio_replaced" as const
            }
          }
        : {})
    });
    if (!updated) {
      await this.audioCleanupService.processBestEffortByStoragePath(
        stored.storagePath
      );
      if (await this.repository.getById(id)) {
        throw sermonStateChanged(id);
      }
      return null;
    }
    if (
      existingAudio?.storagePath &&
      existingAudio.storagePath !== stored.storagePath
    ) {
      await this.audioCleanupService.processBestEffortByStoragePath(
        existingAudio.storagePath
      );
    }
    return updated;
  }

  async removeAudio(
    id: string,
    context: SermonMutationContext
  ) {
    const existing = await this.repository.getById(id);
    if (!existing) {
      return null;
    }
    assertExpectedRevision(existing, context.expectedRevision);
    assertSermonMutationAllowed(existing, existing.status, context);
    if (existing.status === "published") {
      throw publishedSermonAssetLocked(id, "audio");
    }
    const existingAudio = await this.repository.getAudioRecord(id);
    const updated = await this.repository.removeAudio(id, {
      expectedRevision: context.expectedRevision,
      ...(existingAudio?.storagePath
        ? {
            audioCleanup: {
              storagePath: existingAudio.storagePath,
              reason: "audio_removed" as const
            }
          }
        : {})
    });
    if (!updated) {
      if (await this.repository.getById(id)) {
        throw sermonStateChanged(id);
      }
      return null;
    }
    if (existingAudio?.storagePath) {
      await this.audioCleanupService.processBestEffortByStoragePath(
        existingAudio.storagePath
      );
    }
    return updated;
  }

  async markProcessingFailed(
    id: string,
    input: { audioFailed?: boolean } = {},
    context: SermonMutationContext
  ) {
    const existing = await this.repository.getById(id);
    if (!existing) {
      return null;
    }
    assertExpectedRevision(existing, context.expectedRevision);
    assertSermonMutationAllowed(existing, existing.status, context);
    let current = existing;
    if (input.audioFailed && existing.audio.status !== "ready") {
      const marked = await this.repository.markAudioFailed(id, {
        expectedRevision: context.expectedRevision
      });
      if (!marked && (await this.repository.getById(id))) {
        throw sermonStateChanged(id);
      }
      if (!marked) {
        return null;
      }
      current = marked;
    }
    if (existing.status === "published" || existing.status === "archived") {
      return current;
    }
    return this.update(id, { status: "failed" }, {
      ...context,
      expectedRevision: current.revision
    });
  }

  async readAudio(id: string, rangeHeader: string | undefined) {
    const audio = await this.repository.getAudioRecord(id);
    if (!audio?.storagePath) {
      return null;
    }
    try {
      return await this.audioStorageService.readAudio({
        storagePath: audio.storagePath,
        mimeType: audio.mimeType,
        rangeHeader
      });
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code === "ENOENT" ||
        (isAppError(error) && error.code === "object_not_found")
      ) {
        return null;
      }
      throw error;
    }
  }

  archive(
    id: string,
    context: SermonMutationContext
  ) {
    return this.update(id, { status: "archived" }, context);
  }

  async delete(
    id: string,
    context: SermonMutationContext
  ) {
    const existing = await this.repository.getById(id);
    if (!existing) {
      return false;
    }
    assertExpectedRevision(existing, context.expectedRevision);
    assertSermonMutationAllowed(existing, existing.status, context);
    const existingAudio = await this.repository.getAudioRecord(id);
    const deleted = await this.repository.delete(id, {
      expectedRevision: context.expectedRevision,
      ...(existingAudio?.storagePath
        ? {
            audioCleanup: {
              storagePath: existingAudio.storagePath,
              reason: "sermon_deleted" as const
            }
          }
        : {})
    });
    if (!deleted && (await this.repository.getById(id))) {
      throw sermonStateChanged(id);
    }
    if (deleted && existingAudio?.storagePath) {
      await this.audioCleanupService.processBestEffortByStoragePath(
        existingAudio.storagePath
      );
    }
    return deleted;
  }
}

function toPublicSermon(sermon: Sermon): PublicSermon {
  return publicSermonSchema.parse(sermon);
}

function assertExpectedRevision(sermon: Sermon, expectedRevision: number) {
  if (sermon.revision !== expectedRevision) {
    throw sermonStateChanged(sermon.id);
  }
}
