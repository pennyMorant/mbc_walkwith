import { describe, expect, it } from "vitest";

import { RepositoryGroupMaterialDirectory } from "../src/modules/groups/group_material_directory.js";

describe("group material directory", () => {
  it("resolves every material type through its source owner", async () => {
    const directory = new RepositoryGroupMaterialDirectory(
      {
        getPlanById: async (id) => (id === "plan-1" ? { id } : null)
      },
      {
        getGuideById: async (id) => (id === "guide-1" ? { id } : null)
      },
      {
        getById: async (id) => (id === "course-1" ? { id } : null)
      }
    );

    await expect(directory.exists("manual", "manual-1")).resolves.toBe(true);
    await expect(directory.exists("reading_plan", "plan-1")).resolves.toBe(true);
    await expect(
      directory.exists("sermon_discussion_guide", "guide-1")
    ).resolves.toBe(true);
    await expect(directory.exists("course", "course-1")).resolves.toBe(true);
    await expect(directory.exists("reading_plan", "missing")).resolves.toBe(
      false
    );
    await expect(
      directory.exists("sermon_discussion_guide", "missing")
    ).resolves.toBe(false);
    await expect(directory.exists("course", "missing")).resolves.toBe(false);
  });
});
