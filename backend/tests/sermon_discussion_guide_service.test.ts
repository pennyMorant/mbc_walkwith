import type { SermonDiscussionGuide } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import {
  SermonDiscussionPublicGuideConflictError,
  type SermonDiscussionGuideRepository
} from "../src/modules/sermon-discussion-guides/sermon-discussion-guide.repository.js";
import { SermonDiscussionGuideService } from "../src/modules/sermon-discussion-guides/sermon-discussion-guide.service.js";
import type { SermonDiscussionAudienceDirectory } from "../src/modules/sermon-discussion-guides/sermon_discussion_audience_directory.js";
import type { SermonService } from "../src/modules/sermons/sermon.service.js";

describe("SermonDiscussionGuideService", () => {
  it("maps a concurrent public guide constraint conflict to a feature error", async () => {
    const guide = reviewGuide();
    const repository = {
      getGuideById: async () => guide,
      getPublishedGuideBySermonId: async () => null,
      updateGuide: async () => {
        throw new SermonDiscussionPublicGuideConflictError(guide.sermonId);
      }
    } as unknown as SermonDiscussionGuideRepository;
    const sermonService = {
      getById: async () => ({ status: "published" })
    } as unknown as SermonService;
    const service = new SermonDiscussionGuideService(
      repository,
      sermonService,
      existingAudienceDirectory()
    );

    await expect(
      service.updateGuide(guide.id, {
        status: "published",
        expectedRevision: guide.revision
      })
    ).rejects.toMatchObject({
      code: "sermon_discussion_public_guide_conflict",
      statusCode: 409,
      evidence: { sermonId: guide.sermonId }
    });
  });

  it("rejects a scoped guide when its audience target does not exist", async () => {
    const repository = {
      createGuide: async () => {
        throw new Error("createGuide must not run for a missing target");
      }
    } as unknown as SermonDiscussionGuideRepository;
    const sermonService = {
      getById: async () => ({ status: "published" })
    } as unknown as SermonService;
    const service = new SermonDiscussionGuideService(
      repository,
      sermonService,
      missingAudienceDirectory()
    );

    await expect(
      service.createGuide({
        sermonId: "sermon-published",
        title: "Missing group guide",
        summary: "",
        status: "review",
        audienceType: "group",
        audienceId: "missing-group",
        questions: [],
        actionSteps: [],
        prayerPrompts: [],
        generatedMetadata: {}
      })
    ).rejects.toMatchObject({
      code: "sermon_discussion_audience_target_not_found",
      statusCode: 404,
      evidence: {
        audienceType: "group",
        audienceId: "missing-group"
      }
    });
  });

  it("rejects changing a guide to a missing scoped audience target", async () => {
    const guide = reviewGuide();
    const repository = {
      getGuideById: async () => guide,
      updateGuide: async () => {
        throw new Error("updateGuide must not run for a missing target");
      }
    } as unknown as SermonDiscussionGuideRepository;
    const sermonService = {} as SermonService;
    const service = new SermonDiscussionGuideService(
      repository,
      sermonService,
      missingAudienceDirectory()
    );

    await expect(
      service.updateGuide(guide.id, {
        audienceType: "course",
        audienceId: "missing-course",
        expectedRevision: guide.revision
      })
    ).rejects.toMatchObject({
      code: "sermon_discussion_audience_target_not_found",
      statusCode: 404,
      evidence: {
        audienceType: "course",
        audienceId: "missing-course"
      }
    });
  });

  it("allows a guide to be archived after its scoped target was removed", async () => {
    const guide = {
      ...reviewGuide(),
      audienceType: "group" as const,
      audienceId: "removed-group"
    };
    const repository = {
      getGuideById: async () => guide,
      updateGuide: async () => ({
        ...guide,
        status: "archived" as const
      })
    } as unknown as SermonDiscussionGuideRepository;
    const service = new SermonDiscussionGuideService(
      repository,
      {} as SermonService,
      missingAudienceDirectory()
    );

    await expect(
      service.updateGuide(guide.id, {
        status: "archived",
        expectedRevision: guide.revision
      })
    ).resolves.toMatchObject({ status: "archived" });
  });
});

function existingAudienceDirectory(): SermonDiscussionAudienceDirectory {
  return { exists: async () => true };
}

function missingAudienceDirectory(): SermonDiscussionAudienceDirectory {
  return { exists: async () => false };
}

function reviewGuide(): SermonDiscussionGuide {
  return {
    id: "guide-review",
    sermonId: "sermon-published",
    title: "Reviewed guide",
    summary: "",
    status: "review",
    audienceType: "public",
    audienceId: null,
    questions: [],
    actionSteps: [],
    prayerPrompts: ["Pray for wisdom."],
    generatedMetadata: {},
    publishedAt: null,
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z"
  };
}
