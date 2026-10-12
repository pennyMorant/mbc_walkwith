import { describe, expect, test } from "bun:test";

import { notificationDraftFromMarkdown } from "../src/features/life-posts/composables/use_life_post_ai_drafts";
import { outlineItemsFromMarkdown } from "../src/features/sermons/composables/use_sermon_ai_drafts";

describe("admin AI draft parsers", () => {
  test("parses outline bullets without inventing sermon timestamps", () => {
    const items = outlineItemsFromMarkdown(
      "## Sermon outline\n- Promise: God remains faithful.\n- Response: Walk in faith.",
      [
        {
          title: "Existing first point",
          startSeconds: 95,
          summary: ""
        }
      ]
    );

    expect(items).toEqual([
      {
        title: "Promise",
        startSeconds: 95,
        summary: "God remains faithful."
      },
      {
        title: "Response",
        startSeconds: 0,
        summary: "Walk in faith."
      }
    ]);
  });

  test("parses stable and Markdown-section notification formats", () => {
    expect(
      notificationDraftFromMarkdown(
        "Title: Sunday Service\nBody: Join us at 10 AM."
      )
    ).toEqual({
      title: "Sunday Service",
      body: "Join us at 10 AM."
    });
    expect(
      notificationDraftFromMarkdown(
        "## Title\nSunday Service\n## Body\nJoin us for worship."
      )
    ).toEqual({
      title: "Sunday Service",
      body: "Join us for worship."
    });
  });
});
