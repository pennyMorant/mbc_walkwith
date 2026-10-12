import {
  publicSermonDiscussionGuideSchema,
  type PublicSermonDiscussionGuide,
  type SermonDiscussionGuide,
  type SermonDiscussionGuideStatus,
  type SermonDiscussionGuideCreateRequest,
  type SermonDiscussionGuideListQuery,
  type SermonDiscussionGuideUpdateRequest,
  type SermonDiscussionResponseCreateRequest,
  type SermonDiscussionResponseListQuery
} from "@mbc/api-contracts";
import { isDeepStrictEqual } from "node:util";

import type { SermonService } from "../sermons/sermon.service.js";
import {
  sermonDiscussionGuideNotFound,
  sermonDiscussionGuideStateChanged,
  sermonDiscussionAudienceInvalid,
  sermonDiscussionAudienceTargetNotFound,
  sermonDiscussionPublicGuideConflict,
  sermonDiscussionResponseInvalid,
  sermonDiscussionResponseNotFound,
  sermonDiscussionReviewRequired,
  sermonDiscussionSermonNotPublished,
  sermonDiscussionSermonNotFound,
  sermonDiscussionTransitionInvalid,
  sermonDiscussionUserRequired,
  sermonDiscussionVisibilityDenied
} from "./sermon-discussion-guide-errors.js";
import {
  SermonDiscussionPublicGuideConflictError,
  type SermonDiscussionGuideRepository,
  type SermonDiscussionViewer
} from "./sermon-discussion-guide.repository.js";
import type { SermonDiscussionAudienceDirectory } from "./sermon_discussion_audience_directory.js";

export class SermonDiscussionGuideService {
  constructor(
    private readonly repository: SermonDiscussionGuideRepository,
    private readonly sermonService: SermonService,
    private readonly audienceDirectory: SermonDiscussionAudienceDirectory
  ) {}

  listGuides(query: SermonDiscussionGuideListQuery) {
    return this.repository.listGuides(query);
  }

  getGuideById(id: string) {
    return this.repository.getGuideById(id);
  }

  async getPublishedGuideForSermon(
    sermonId: string
  ): Promise<PublicSermonDiscussionGuide> {
    await this.requirePublicSermon(sermonId);
    const guide = await this.repository.getPublishedGuideBySermonId(sermonId);
    if (!guide) {
      throw sermonDiscussionGuideNotFound(sermonId);
    }
    return publicSermonDiscussionGuideSchema.parse(guide);
  }

  async createGuide(input: SermonDiscussionGuideCreateRequest) {
    await this.requireSermon(input.sermonId);
    assertInitialGuideStatus(input.status);
    const audienceId = normalizeAudienceId(input.audienceId ?? null);
    assertGuideAudience("new", input.audienceType, audienceId);
    await this.requireAudienceTarget(input.audienceType, audienceId);
    return this.repository.createGuide({ ...input, audienceId });
  }

  async updateGuide(id: string, input: SermonDiscussionGuideUpdateRequest) {
    const existing = await this.repository.getGuideById(id);
    if (!existing) {
      throw sermonDiscussionGuideNotFound(id);
    }
    if (existing.revision !== input.expectedRevision) {
      throw sermonDiscussionGuideStateChanged(id);
    }
    const nextStatus = input.status ?? existing.status;
    const nextAudienceType = input.audienceType ?? existing.audienceType;
    const nextAudienceId =
      input.audienceId === undefined
        ? existing.audienceId
        : normalizeAudienceId(input.audienceId);
    const normalizedInput =
      input.audienceId === undefined
        ? input
        : { ...input, audienceId: nextAudienceId };
    assertGuideTransition(existing.id, existing.status, nextStatus);
    assertGuideAudience(
      existing.id,
      nextAudienceType,
      nextAudienceId
    );
    if (
      input.audienceType !== undefined ||
      input.audienceId !== undefined ||
      nextStatus === "published"
    ) {
      await this.requireAudienceTarget(nextAudienceType, nextAudienceId);
    }
    if (
      existing.status === "published" &&
      nextStatus === "published" &&
      hasGuideContentChanged(existing, normalizedInput)
    ) {
      throw sermonDiscussionTransitionInvalid(
        existing.id,
        existing.status,
        nextStatus,
        "published_content_locked"
      );
    }
    if (nextStatus === "published") {
      await this.requirePublishedSermon(existing.sermonId);
      assertGuideHasMaterial(existing, normalizedInput);
      if (nextAudienceType === "public") {
        await this.requirePublicGuideSlot(existing.sermonId, existing.id);
      }
    }
    let guide: SermonDiscussionGuide | null;
    try {
      guide = await this.repository.updateGuide(id, normalizedInput);
    } catch (error) {
      if (error instanceof SermonDiscussionPublicGuideConflictError) {
        throw sermonDiscussionPublicGuideConflict(error.sermonId);
      }
      throw error;
    }
    if (!guide) {
      throw sermonDiscussionGuideStateChanged(id);
    }
    return guide;
  }

  listResponses(query: SermonDiscussionResponseListQuery) {
    return this.repository.listResponses(query);
  }

  async createResponse(
    guideId: string,
    viewer: SermonDiscussionViewer | null,
    input: SermonDiscussionResponseCreateRequest
  ) {
    const cleanViewer = requireViewer(viewer);
    const guide = await this.repository.getGuideById(guideId);
    if (
      !guide ||
      guide.status !== "published" ||
      guide.audienceType !== "public"
    ) {
      throw sermonDiscussionGuideNotFound(guideId);
    }
    await this.requirePublicSermon(guide.sermonId);
    assertQuestionBelongsToGuide(guide, input);
    assertResponseVisibilityAllowed(guideId, input);
    return this.repository.createResponse(guideId, cleanViewer, input);
  }

  async hideResponse(responseId: string) {
    const existing = await this.repository.getResponseById(responseId);
    if (!existing || existing.status !== "shared_with_group") {
      throw sermonDiscussionResponseNotFound(responseId);
    }
    const response = await this.repository.updateResponseStatus(
      responseId,
      "hidden"
    );
    if (!response) {
      throw sermonDiscussionResponseNotFound(responseId);
    }
    return response;
  }

  private async requireSermon(sermonId: string) {
    const sermon = await this.sermonService.getById(sermonId);
    if (!sermon) {
      throw sermonDiscussionSermonNotFound(sermonId);
    }
    return sermon;
  }

  private async requirePublicSermon(sermonId: string) {
    const sermon = await this.sermonService.getPublishedById(sermonId);
    if (!sermon) {
      throw sermonDiscussionGuideNotFound(sermonId);
    }
    return sermon;
  }

  private async requirePublishedSermon(sermonId: string) {
    const sermon = await this.requireSermon(sermonId);
    if (sermon.status !== "published") {
      throw sermonDiscussionSermonNotPublished(sermonId);
    }
    return sermon;
  }

  private async requirePublicGuideSlot(sermonId: string, guideId: string) {
    const publishedGuide =
      await this.repository.getPublishedGuideBySermonId(sermonId);
    if (publishedGuide && publishedGuide.id !== guideId) {
      throw sermonDiscussionPublicGuideConflict(sermonId);
    }
  }

  private async requireAudienceTarget(
    audienceType: SermonDiscussionGuide["audienceType"],
    audienceId: string | null
  ) {
    if (audienceType === "public") {
      return;
    }
    if (
      audienceId === null ||
      !(await this.audienceDirectory.exists(audienceType, audienceId))
    ) {
      throw sermonDiscussionAudienceTargetNotFound(
        audienceType,
        audienceId ?? ""
      );
    }
  }
}

const allowedGuideTransitions: Record<
  SermonDiscussionGuideStatus,
  ReadonlySet<SermonDiscussionGuideStatus>
> = {
  draft: new Set(["draft", "review", "archived"]),
  review: new Set(["draft", "review", "published", "archived"]),
  published: new Set(["published", "review", "archived"]),
  archived: new Set(["archived", "draft"])
};

function assertInitialGuideStatus(status: SermonDiscussionGuideStatus) {
  if (status !== "draft" && status !== "review") {
    throw sermonDiscussionTransitionInvalid(
      "new",
      "new",
      status,
      "new_guide_must_start_as_draft_or_review"
    );
  }
}

function assertGuideTransition(
  guideId: string,
  fromStatus: SermonDiscussionGuideStatus,
  toStatus: SermonDiscussionGuideStatus
) {
  if (!allowedGuideTransitions[fromStatus].has(toStatus)) {
    throw sermonDiscussionTransitionInvalid(
      guideId,
      fromStatus,
      toStatus,
      "transition_not_allowed"
    );
  }
}

function assertGuideAudience(
  guideId: string,
  audienceType: SermonDiscussionGuide["audienceType"],
  audienceId: string | null
) {
  const cleanAudienceId = audienceId?.trim() || null;
  const valid =
    audienceType === "public"
      ? cleanAudienceId === null
      : cleanAudienceId !== null;
  if (!valid) {
    throw sermonDiscussionAudienceInvalid(guideId, audienceType);
  }
}

function normalizeAudienceId(audienceId: string | null) {
  return audienceId?.trim() || null;
}

function assertGuideHasMaterial(
  existing: SermonDiscussionGuide,
  input: SermonDiscussionGuideUpdateRequest
) {
  const questions = input.questions ?? existing.questions;
  const actionSteps = input.actionSteps ?? existing.actionSteps;
  const prayerPrompts = input.prayerPrompts ?? existing.prayerPrompts;
  if (
    questions.length === 0 &&
    actionSteps.length === 0 &&
    !prayerPrompts.some((prompt) => prompt.trim().length > 0)
  ) {
    throw sermonDiscussionReviewRequired(existing.id);
  }
}

function hasGuideContentChanged(
  existing: SermonDiscussionGuide,
  input: SermonDiscussionGuideUpdateRequest
) {
  return (
    (input.title !== undefined && input.title.trim() !== existing.title) ||
    (input.summary !== undefined && input.summary.trim() !== existing.summary) ||
    (input.audienceType !== undefined &&
      input.audienceType !== existing.audienceType) ||
    (input.audienceId !== undefined &&
      (input.audienceId?.trim() || null) !== existing.audienceId) ||
    (input.questions !== undefined &&
      !isDeepStrictEqual(input.questions, existing.questions)) ||
    (input.actionSteps !== undefined &&
      !isDeepStrictEqual(input.actionSteps, existing.actionSteps)) ||
    (input.prayerPrompts !== undefined &&
      !isDeepStrictEqual(input.prayerPrompts, existing.prayerPrompts)) ||
    (input.generatedMetadata !== undefined &&
      !isDeepStrictEqual(input.generatedMetadata, existing.generatedMetadata))
  );
}

function requireViewer(
  viewer: SermonDiscussionViewer | null
): SermonDiscussionViewer {
  if (!viewer) {
    throw sermonDiscussionUserRequired();
  }
  return viewer;
}

function assertQuestionBelongsToGuide(
  guide: SermonDiscussionGuide,
  input: SermonDiscussionResponseCreateRequest
) {
  if (!input.questionId) {
    return;
  }
  if (!guide.questions.some((question) => question.id === input.questionId)) {
    throw sermonDiscussionResponseInvalid(guide.id, input.questionId);
  }
}

function assertResponseVisibilityAllowed(
  guideId: string,
  input: SermonDiscussionResponseCreateRequest
) {
  if (input.status !== "private") {
    throw sermonDiscussionVisibilityDenied(guideId, input.status);
  }
}
