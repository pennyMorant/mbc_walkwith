import { describe, expect, test } from "bun:test";

const bibleNotes = await Bun.file(
  new URL("../src/features/bible-notes/components/BibleNoteResults.vue", import.meta.url)
).text();
const discussionResponses = await Bun.file(
  new URL(
    "../src/features/sermon-discussion-guides/components/SermonDiscussionResponsesPanel.vue",
    import.meta.url
  )
).text();

describe("content moderation responsive results", () => {
  test("projects the same Bible note records into desktop and mobile views", () => {
    expect(bibleNotes).toContain("d-none d-md-block");
    expect(bibleNotes).toContain("d-md-none");
    expect(bibleNotes.match(/v-for="note in notes"/g)).toHaveLength(2);
    expect(bibleNotes).toContain("$emit('open', note)");
    expect(bibleNotes).toContain("AdminDataState");
    expect(bibleNotes).toContain("$emit('retry')");
    expect(bibleNotes).not.toContain("@/core/api");
  });

  test("keeps discussion moderation available in both responsive views", () => {
    expect(discussionResponses).toContain("d-none d-md-block");
    expect(discussionResponses).toContain("d-md-none");
    expect(discussionResponses.match(/v-for="response in responses"/g)).toHaveLength(2);
    expect(discussionResponses.match(/\$emit\('hideResponse', response.id\)/g)).toHaveLength(2);
    expect(discussionResponses).toContain("AdminDataState");
    expect(discussionResponses).toContain("$emit('refresh')");
  });
});
