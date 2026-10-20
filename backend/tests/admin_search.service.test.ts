import { describe, expect, it, vi } from "vitest";

import { AdminSearchService } from "../src/modules/admin/search/admin_search.service.js";

describe("AdminSearchService", () => {
  it("merges only resources allowed for the admin role", async () => {
    const dependencies = fakeDependencies();
    const service = new AdminSearchService(dependencies);

    const response = await service.search("owner", "hope");

    expect(response.items).toEqual([
      expect.objectContaining({ resourceType: "sermon", path: "/sermons" }),
      expect.objectContaining({ resourceType: "life_post", path: "/life-posts" }),
      expect.objectContaining({ resourceType: "member", path: "/members" })
    ]);
  });

  it("does not query content or member services for finance admins", async () => {
    const dependencies = fakeDependencies();
    const service = new AdminSearchService(dependencies);

    const response = await service.search("finance", "hope");

    expect(response.items).toEqual([]);
    expect(dependencies.sermons.list).not.toHaveBeenCalled();
    expect(dependencies.lifePosts.list).not.toHaveBeenCalled();
    expect(dependencies.members.list).not.toHaveBeenCalled();
  });
});

function fakeDependencies() {
  return {
    sermons: {
      list: vi.fn(async () => ({
        sermons: [{ id: "sermon-1", title: "Hope", speaker: "Pastor", status: "published" }],
        nextCursor: null
      }))
    },
    lifePosts: {
      list: vi.fn(async () => [
        { id: "life-1", title: "Hope gathering", type: "event", status: "published" }
      ])
    },
    members: {
      list: vi.fn(async () => [
        { id: "member-1", displayName: "Hope Lee", email: "hope@example.com" }
      ])
    }
  };
}
