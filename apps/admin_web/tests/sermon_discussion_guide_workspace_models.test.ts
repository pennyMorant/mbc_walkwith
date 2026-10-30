import { describe, expect, it } from "bun:test";

import {
  canSubmitSermonDiscussionGuide,
  createSermonDiscussionGuideFilterForm,
  createSermonDiscussionGuideForm,
  createSermonDiscussionLocalIdFactory,
  sermonDiscussionCommandTargetsSelection,
  sermonDiscussionGuideFilterSnapshot,
  sermonDiscussionGuidePayload,
  sameSermonDiscussionGuideFilters
} from "../src/features/sermon-discussion-guides/sermon_discussion_guide_workspace_models";

describe("sermon discussion guide workspace models", () => {
  it("keeps local editor item ids unique within the same millisecond", () => {
    const nextId = createSermonDiscussionLocalIdFactory(() => 1234);

    expect(nextId("question")).toBe("question_1234_1");
    expect(nextId("question")).toBe("question_1234_2");
    expect(nextId("action")).toBe("action_1234_3");
  });

  it("keeps editable guide filters separate from normalized query values", () => {
    const filters = createSermonDiscussionGuideFilterForm();
    filters.query = "  grace  ";
    filters.sermonId = " sermon-1 ";
    filters.status = "review";

    const snapshot = sermonDiscussionGuideFilterSnapshot(filters);

    expect(snapshot).toEqual({
      query: "grace",
      sermonId: "sermon-1",
      status: "review",
      audienceType: ""
    });
    expect(filters.query).toBe("  grace  ");
    expect(sameSermonDiscussionGuideFilters(snapshot, { ...snapshot })).toBe(
      true
    );
  });

  it("freezes a normalized save payload without mutating the editor", () => {
    const form = createSermonDiscussionGuideForm();
    form.sermonId = " sermon-1 ";
    form.title = "  Living in grace  ";
    form.audienceType = "group";
    form.audienceId = " group-1 ";
    form.questions.push({
      id: "question-1",
      type: "application",
      prompt: "  How will we respond?  ",
      sort: 8,
      startSeconds: null
    });

    const payload = sermonDiscussionGuidePayload(form, () => "unused");
    form.title = "Changed later";

    expect(payload).toMatchObject({
      sermonId: "sermon-1",
      title: "Living in grace",
      audienceId: "group-1",
      questions: [{ prompt: "How will we respond?", sort: 0 }]
    });
    expect(canSubmitSermonDiscussionGuide(true, payload, null)).toBe(true);
  });

  it("accepts asynchronous results only for the active guide context", () => {
    expect(sermonDiscussionCommandTargetsSelection(null, null)).toBe(true);
    expect(sermonDiscussionCommandTargetsSelection("guide-1", "guide-1")).toBe(
      true
    );
    expect(sermonDiscussionCommandTargetsSelection("guide-2", "guide-1")).toBe(
      false
    );
  });
});
