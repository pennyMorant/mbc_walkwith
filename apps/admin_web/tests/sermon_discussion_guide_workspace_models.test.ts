import { describe, expect, it } from "bun:test";

import { createSermonDiscussionLocalIdFactory } from "../src/features/sermon-discussion-guides/sermon_discussion_guide_workspace_models";

describe("sermon discussion guide workspace models", () => {
  it("keeps local editor item ids unique within the same millisecond", () => {
    const nextId = createSermonDiscussionLocalIdFactory(() => 1234);

    expect(nextId("question")).toBe("question_1234_1");
    expect(nextId("question")).toBe("question_1234_2");
    expect(nextId("action")).toBe("action_1234_3");
  });
});
