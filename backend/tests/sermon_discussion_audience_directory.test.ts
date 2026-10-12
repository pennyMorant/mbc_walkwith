import { describe, expect, it, vi } from "vitest";

import { RepositorySermonDiscussionAudienceDirectory } from "../src/modules/sermon-discussion-guides/sermon_discussion_audience_directory.js";

describe("RepositorySermonDiscussionAudienceDirectory", () => {
  it("resolves each scoped audience through its owning repository", async () => {
    const groups = { getById: vi.fn(async () => ({ id: "group-1" })) };
    const courses = { getById: vi.fn(async () => ({ id: "course-1" })) };
    const discipleship = {
      getJourneyById: vi.fn(async () => ({ id: "journey-1" }))
    };
    const directory = new RepositorySermonDiscussionAudienceDirectory(
      groups,
      courses,
      discipleship
    );

    await expect(directory.exists("group", "group-1")).resolves.toBe(true);
    await expect(directory.exists("course", "course-1")).resolves.toBe(true);
    await expect(
      directory.exists("discipleship", "journey-1")
    ).resolves.toBe(true);
    expect(groups.getById).toHaveBeenCalledWith("group-1");
    expect(courses.getById).toHaveBeenCalledWith("course-1");
    expect(discipleship.getJourneyById).toHaveBeenCalledWith("journey-1");
  });

  it("returns false when the owning repository cannot find the target", async () => {
    const directory = new RepositorySermonDiscussionAudienceDirectory(
      { getById: async () => null },
      { getById: async () => null },
      { getJourneyById: async () => null }
    );

    await expect(directory.exists("group", "missing-group")).resolves.toBe(
      false
    );
    await expect(directory.exists("course", "missing-course")).resolves.toBe(
      false
    );
    await expect(
      directory.exists("discipleship", "missing-journey")
    ).resolves.toBe(false);
  });
});
