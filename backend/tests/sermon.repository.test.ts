import { describe, expect, it } from "vitest";

import { InMemorySermonRepository } from "../src/modules/sermons/in-memory-sermon.repository.js";

describe("InMemorySermonRepository", () => {
  it("creates local sermon drafts", async () => {
    const repository = new InMemorySermonRepository();
    const sermon = await repository.createDraft({
      title: "Local Draft Sermon",
      speaker: "Pastor",
      sermonDate: "2026-05-24",
      series: "Psalms",
      primaryReference: "Psalm 23",
      summary: "Initial draft summary",
      transcript: {
        text: "Initial reviewed manuscript",
        source: "manual",
        updatedAt: null
      },
      reviewMarkdown: "# Initial review"
    });

    expect(sermon.status).toBe("draft");
    expect(sermon.title).toBe("Local Draft Sermon");
    expect(sermon.transcript).toMatchObject({
      text: "Initial reviewed manuscript",
      source: "manual"
    });
    expect(sermon.transcript?.updatedAt).toEqual(expect.any(String));
    expect(sermon.reviewMarkdown).toBe("# Initial review");
    expect(sermon.processingMetadata).toBeNull();
  });

  it("filters public sermon list by Scripture book", async () => {
    const repository = new InMemorySermonRepository();
    const result = await repository.list({ limit: 20, bookId: "rom" });

    expect(result.sermons.map((sermon) => sermon.id)).toContain(
      "sermon-romans-hope"
    );
  });

  it("filters public sermon list by date range", async () => {
    const repository = new InMemorySermonRepository();
    const mayResult = await repository.list({
      limit: 20,
      from: "2026-05-01T00:00:00.000Z",
      to: "2026-06-01T00:00:00.000Z"
    });
    const juneResult = await repository.list({
      limit: 20,
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-07-01T00:00:00.000Z"
    });

    expect(mayResult.sermons.map((sermon) => sermon.id)).toContain(
      "sermon-romans-hope"
    );
    expect(juneResult.sermons.map((sermon) => sermon.id)).not.toContain(
      "sermon-romans-hope"
    );
  });

  it("searches sermon transcript and structured Scripture text", async () => {
    const repository = new InMemorySermonRepository();
    const sermon = await repository.createDraft({
      title: "Discovery Coverage",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });
    await repository.update(sermon.id, {
      status: "published",
      transcript: {
        text: "A message about steadfast discipleship.",
        source: "manual",
        updatedAt: null
      },
      references: [
        {
          reference: "John 15:5",
          verseId: "jhn.15.5",
          note: "Abiding in the true vine",
          startSeconds: 30
        }
      ]
    });

    const transcriptResult = await repository.list({
      limit: 20,
      status: "published",
      query: "steadfast discipleship"
    });
    const referenceResult = await repository.list({
      limit: 20,
      status: "published",
      query: "true vine"
    });

    expect(transcriptResult.sermons.map((item) => item.id)).toContain(sermon.id);
    expect(referenceResult.sermons.map((item) => item.id)).toContain(sermon.id);
  });

  it("filters sermons by topic and exposes published discovery facets", async () => {
    const repository = new InMemorySermonRepository();
    const draft = await repository.createDraft({
      title: "Private Topic Draft",
      speaker: "Draft Speaker",
      sermonDate: "2026-07-12",
      series: "Draft Series",
      topics: ["Private Topic"]
    });

    const result = await repository.list({
      limit: 20,
      status: "published",
      topic: "Hope",
      bookId: "rom",
      query: "suffering"
    });
    const facets = await repository.discoveryFacets();

    expect(result.sermons.map((sermon) => sermon.id)).toEqual([
      "sermon-romans-hope"
    ]);
    expect(facets).toMatchObject({
      speakers: ["Pastor David Chen"],
      series: ["Romans"],
      topics: ["Hope", "Suffering"]
    });
    expect(facets.speakers).not.toContain(draft.speaker);
    expect(facets.topics).not.toContain("Private Topic");
  });

  it("recommends published sermons by verse and chapter references", async () => {
    const repository = new InMemorySermonRepository();

    const exact = await repository.recommendations({
      bookId: "rom",
      chapter: 8,
      verseId: "rom.8.28",
      limit: 3
    });
    expect(exact[0]?.id).toBe("sermon-romans-hope");

    const chapter = await repository.recommendations({
      bookId: "rom",
      chapter: 8,
      limit: 3
    });
    expect(chapter.map((sermon) => sermon.id)).toContain("sermon-romans-hope");

    const unrelatedChapter = await repository.recommendations({
      bookId: "rom",
      chapter: 1,
      limit: 3
    });
    expect(unrelatedChapter).toEqual([]);
  });

  it("updates structured sermon resources", async () => {
    const repository = new InMemorySermonRepository();
    const sermon = await repository.createDraft({
      title: "Structured Sermon",
      speaker: "Pastor",
      sermonDate: "2026-05-10"
    });

    const updated = await repository.update(sermon.id, {
      outline: [
        {
          title: "Opening",
          startSeconds: 0,
          summary: "Introduction"
        }
      ],
      references: [
        {
          reference: "Romans 8:28",
          verseId: "rom.8.28",
          note: "Main text",
          startSeconds: 30
        }
      ],
      transcript: {
        text: "Transcript body",
        source: "manual",
        updatedAt: null
      },
      reviewMarkdown: "# Reviewed Sermon\n\nSummary body",
      processingMetadata: {
        pipeline: "local-sermon-studio",
        transcriptionProvider: "local-whisper"
      }
    });

    expect(updated?.outline).toHaveLength(1);
    expect(updated?.references[0]?.verseId).toBe("rom.8.28");
    expect(updated?.transcript?.text).toBe("Transcript body");
    expect(updated?.reviewMarkdown).toContain("# Reviewed Sermon");
    expect(updated?.processingMetadata).toMatchObject({
      pipeline: "local-sermon-studio"
    });
  });

  it("archives and deletes sermon records", async () => {
    const repository = new InMemorySermonRepository();
    const archived = await repository.update("sermon-romans-hope", {
      status: "archived"
    });
    expect(archived?.status).toBe("archived");

    const deleted = await repository.delete("sermon-romans-hope");
    expect(deleted).toBe(true);
    expect(await repository.getById("sermon-romans-hope")).toBeNull();
  });

  it("increments revisions and rejects stale aggregate writes", async () => {
    const repository = new InMemorySermonRepository();
    const sermon = await repository.createDraft({
      title: "Stable Revision",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });
    const updated = await repository.update(sermon.id, {
      references: [
        {
          reference: "John 15:5",
          verseId: "jhn.15.5",
          note: "Second",
          startSeconds: 60
        },
        {
          reference: "Romans 8:28",
          verseId: "rom.8.28",
          note: "First",
          startSeconds: 30
        }
      ],
      topics: ["Faith", "Hope"],
      processingMetadata: { pipeline: "local", provider: "whisper" }
    });
    expect(updated).not.toBeNull();

    expect(updated?.revision).toBe(sermon.revision + 1);

    const stale = await repository.update(
      sermon.id,
      { title: "Stale overwrite" },
      { expectedRevision: sermon.revision }
    );
    expect(stale).toBeNull();
    expect((await repository.getById(sermon.id))?.title).toBe("Stable Revision");
  });
});
