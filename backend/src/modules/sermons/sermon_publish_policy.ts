import type { Sermon, UpdateSermonRequest } from "@mbc/api-contracts";

import {
  publishPermissionDenied,
  reviewRequired
} from "./sermon-errors.js";

export type SermonMutationContext = {
  canPublish: boolean;
  expectedRevision: number;
};

export function assertSermonMutationAllowed(
  sermon: Sermon,
  nextStatus: Sermon["status"],
  context: SermonMutationContext
) {
  if (
    (sermon.status === "published" || nextStatus === "published") &&
    !context.canPublish
  ) {
    throw publishPermissionDenied(sermon.id);
  }
}

export function validateSermonMutation(
  sermon: Sermon,
  input: UpdateSermonRequest,
  context: SermonMutationContext
) {
  const nextStatus = input.status ?? sermon.status;
  assertSermonMutationAllowed(sermon, nextStatus, context);
  if (nextStatus === "published") {
    validatePublishable(buildPublishCandidate(sermon, input));
  }
}

function buildPublishCandidate(
  existing: Sermon,
  input: UpdateSermonRequest
): Sermon {
  return {
    ...existing,
    title: input.title ?? existing.title,
    speaker: input.speaker ?? existing.speaker,
    sermonDate: input.sermonDate ?? existing.sermonDate,
    durationSeconds: input.durationSeconds ?? existing.durationSeconds,
    outline: input.outline ?? existing.outline,
    references: input.references ?? existing.references,
    transcript:
      input.transcript === undefined ? existing.transcript : input.transcript,
    audio: existing.audio
  };
}

function validatePublishable(sermon: Sermon) {
  const missing: string[] = [];

  if (!hasText(sermon.title)) {
    missing.push("title");
  }
  if (!hasText(sermon.speaker)) {
    missing.push("speaker");
  }
  if (!hasText(sermon.sermonDate)) {
    missing.push("sermon_date");
  }
  if (sermon.audio.status !== "ready") {
    missing.push("audio");
  }
  if (!hasText(sermon.transcript?.text)) {
    missing.push("transcript");
  }
  if (sermon.outline.length === 0) {
    missing.push("outline");
  }
  if (sermon.references.length === 0) {
    missing.push("scripture_references");
  }

  if (missing.length > 0) {
    throw reviewRequired(sermon.id, missing);
  }
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}
