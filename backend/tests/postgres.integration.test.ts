import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { PostgresBibleVerseNoteRepository } from "../src/modules/bible-verse-notes/postgres-bible-verse-note.repository.js";
import { createDbFromConnectionString } from "../src/shared/db/client.js";
import { bibleVerseNotes } from "../src/shared/db/schema.js";
import { PostgresSermonRepository } from "../src/modules/sermons/postgres-sermon.repository.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIfDatabase = testDatabaseUrl ? describe : describe.skip;
const execFileAsync = promisify(execFile);
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describeIfDatabase("Postgres integration", () => {
  it("persists sermon records after Drizzle Kit migrations", async () => {
    await execFileAsync("bun", ["run", "db:migrate"], {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl! }
    });

    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresSermonRepository(db);

    const sermon = await repository.createDraft({
      title: `Integration Sermon ${randomUUID()}`,
      speaker: "Integration Pastor",
      sermonDate: "2026-05-10",
      primaryReference: "Romans 8:28",
      topics: ["Integration Hope"],
      transcript: {
        text: "Initial integration manuscript.",
        source: "manual",
        updatedAt: null
      },
      reviewMarkdown: "# Initial integration review"
    });

    expect(sermon.transcript).toMatchObject({
      text: "Initial integration manuscript.",
      source: "manual"
    });
    expect(sermon.transcript?.updatedAt).toEqual(expect.any(String));
    expect(sermon.reviewMarkdown).toBe("# Initial integration review");

    const updated = await repository.update(sermon.id, {
      status: "published",
      transcript: {
        text: "Integration transcript about persevering hope.",
        source: "integration-test",
        updatedAt: null
      },
      references: [
        {
          reference: "Romans 8:28",
          verseId: "rom.8.28",
          note: "Providence in every circumstance",
          startSeconds: 120
        }
      ]
    });

    expect(updated?.status).toBe("published");

    const listed = await repository.list({ limit: 20, bookId: "rom" });
    expect(listed.sermons.map((row) => row.id)).toContain(sermon.id);

    const topicList = await repository.list({
      limit: 20,
      status: "published",
      topic: "Integration Hope"
    });
    expect(topicList.sermons.map((row) => row.id)).toContain(sermon.id);

    const facets = await repository.discoveryFacets();
    expect(facets.topics).toContain("Integration Hope");

    const transcriptSearch = await repository.list({
      limit: 20,
      status: "published",
      query: "persevering hope"
    });
    expect(transcriptSearch.sermons.map((row) => row.id)).toContain(sermon.id);

    const referenceSearch = await repository.list({
      limit: 20,
      status: "published",
      query: "every circumstance"
    });
    expect(referenceSearch.sermons.map((row) => row.id)).toContain(sermon.id);

    const recommendations = await repository.recommendations({
      bookId: "rom",
      chapter: 8,
      verseId: "rom.8.28",
      limit: 3
    });
    expect(recommendations.map((row) => row.id)).toContain(sermon.id);

    await db.execute(sql`delete from sermons where id = ${sermon.id}`);
  });

  it("does not let an author update a note hidden by moderation", async () => {
    await execFileAsync("bun", ["run", "db:migrate"], {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl! }
    });

    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresBibleVerseNoteRepository(db);
    const author = {
      type: "external" as const,
      externalUserId: `ext_integration_${randomUUID()}`,
      displayName: "Integration Reader"
    };
    const note = await repository.create({
      verseId: "rom.8.28",
      bookId: "rom",
      chapter: 8,
      verse: 28,
      content: "Initial reflection.",
      author
    });

    try {
      const hidden = await repository.hide(note.id, {
        hiddenReason: "Integration moderation"
      });
      expect(hidden?.status).toBe("hidden");

      const result = await repository.updateOwned(
        note.id,
        { content: "This update must not republish the note." },
        author
      );
      expect(result).toBe("not_found");

      const current = await repository.getAdminById(note.id);
      expect(current).toMatchObject({
        status: "hidden",
        content: "Initial reflection."
      });
    } finally {
      await db
        .delete(bibleVerseNotes)
        .where(sql`${bibleVerseNotes.id} = ${note.id}`);
    }
  });
});
