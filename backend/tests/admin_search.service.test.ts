import { describe, expect, it, vi } from "vitest";

import { AdminSearchService } from "../src/modules/admin/search/admin_search.service.js";

describe("AdminSearchService", () => {
  it("merges only resources allowed for the admin role", async () => {
    const dependencies = fakeDependencies();
    const service = new AdminSearchService(dependencies);

    const response = await service.search("owner", "hope");

    expect(response.items).toEqual([
      expect.objectContaining({ resourceType: "sermon", path: "/sermons?open=sermon-1" }),
      expect.objectContaining({ resourceType: "life_post", path: "/life-posts?open=life-1" }),
      expect.objectContaining({ resourceType: "member", path: "/members?open=member-1" })
    ]);
    expect(dependencies.sermons.searchSummaries).toHaveBeenCalledWith("hope", 5);
    expect(dependencies.lifePosts.searchSummaries).toHaveBeenCalledWith("hope", 5);
  });

  it("does not query content or member services for finance admins", async () => {
    const dependencies = fakeDependencies();
    const service = new AdminSearchService(dependencies);

    const response = await service.search("finance", "hope");

    expect(response.items).toEqual([]);
    expect(dependencies.sermons.searchSummaries).not.toHaveBeenCalled();
    expect(dependencies.lifePosts.searchSummaries).not.toHaveBeenCalled();
    expect(dependencies.members.list).not.toHaveBeenCalled();
  });
});

function fakeDependencies() {
  return {
    sermons: {
      searchSummaries: vi.fn(async () => [
        { id: "sermon-1", title: "Hope", speaker: "Pastor", status: "published" }
      ])
    },
    lifePosts: {
      searchSummaries: vi.fn(async () => [
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
