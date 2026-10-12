import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { PostgresSermonDiscussionGuideRepository } from "../src/modules/sermon-discussion-guides/postgres-sermon-discussion-guide.repository.js";
import { SermonDiscussionPublicGuideConflictError } from "../src/modules/sermon-discussion-guides/sermon-discussion-guide.repository.js";
import type { AppDb } from "../src/shared/db/client.js";

describe("PostgresSermonDiscussionGuideRepository", () => {
  it("maps the wrapped public guide unique violation", async () => {
    const row = reviewGuideRow();
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [row] })
        })
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: async () => {
              throw {
                cause: {
                  code: "23505",
                  constraint:
                    "uq_sermon_discussion_guides_public_published"
                }
              };
            }
          })
        })
      })
    } as unknown as AppDb;
    const repository = new PostgresSermonDiscussionGuideRepository(db);

    await expect(
      repository.updateGuide(row.id, {
        status: "published",
        expectedRevision: row.revision
      })
    ).rejects.toMatchObject({
      name: SermonDiscussionPublicGuideConflictError.name,
      sermonId: row.sermonId
    });
  });

  it.each([
    ["prayer prompts", { prayerPrompts: ["Valid prayer", 7] }],
    ["generated metadata", { generatedMetadata: [] }]
  ])("rejects malformed persisted %s", async (_label, override) => {
    const row = { ...reviewGuideRow(), ...override };
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [row] })
        })
      })
    } as unknown as AppDb;
    const repository = new PostgresSermonDiscussionGuideRepository(db);

    await expect(repository.getGuideById(row.id)).rejects.toBeInstanceOf(
      ZodError
    );
  });
});

function reviewGuideRow() {
  const timestamp = new Date("2026-07-12T00:00:00.000Z");
  return {
    id: "guide-review",
    sermonId: "sermon-published",
    revision: 4,
    sourceLocale: "en",
    title: "Reviewed guide",
    summary: "",
    status: "review" as const,
    audienceType: "public" as const,
    audienceId: null,
    questions: [],
    actionSteps: [],
    prayerPrompts: ["Pray for wisdom."],
    generatedMetadata: {},
    publishedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
