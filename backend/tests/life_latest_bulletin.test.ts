import {
  lifePostListQuerySchema,
  lifePostSchema,
  lifeLatestBulletinQuerySchema,
  type LifePostListQuery,
  publicLifePostSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { InMemoryLifePostRepository } from "../src/modules/life/in-memory-life-post.repository.js";
import {
  LifePostService,
  selectLatestBulletin
} from "../src/modules/life/life-post.service.js";
import type { MediaService } from "../src/modules/media/media.service.js";

describe("latest life bulletin selection", () => {
  it("selects the highest-priority bulletin and ignores unrelated posts", () => {
    const selected = selectLatestBulletin([
      post({ id: "event", type: "event", sort: 999 }),
      post({ id: "older", type: "weekly_bulletin", sort: 10 }),
      post({ id: "priority", type: "sunday", sort: 20 })
    ]);

    expect(selected?.id).toBe("priority");
  });

  it("uses the newest start time when priorities match", () => {
    const selected = selectLatestBulletin([
      post({
        id: "earlier",
        type: "weekly_bulletin",
        sort: 10,
        startsAt: "2026-10-18T17:00:00.000Z"
      }),
      post({
        id: "later",
        type: "weekly_bulletin",
        sort: 10,
        startsAt: "2026-10-18T18:00:00.000Z"
      })
    ]);

    expect(selected?.id).toBe("later");
  });

  it("returns null when the requested week has no bulletin", () => {
    expect(selectLatestBulletin([post({ id: "event", type: "event" })])).toBe(
      null
    );
  });

  it("rejects a bulletin range whose end is not after its start", () => {
    expect(() =>
      lifeLatestBulletinQuerySchema.parse({
        from: "2026-10-19T00:00:00.000Z",
        to: "2026-10-18T00:00:00.000Z"
      })
    ).toThrow("from must be earlier than to");
  });

  it("rejects an inverted range on the general Life list contract", () => {
    expect(() =>
      lifePostListQuerySchema.parse({
        from: "2026-10-19T00:00:00.000Z",
        to: "2026-10-18T00:00:00.000Z"
      })
    ).toThrow("from must be earlier than to");
  });

  it("queries bulletin types directly instead of truncating mixed content", async () => {
    const repository = new BulletinProbeRepository();
    const service = new LifePostService(repository, {
      findPublicByIds: async () => new Map()
    } as MediaService);

    const selected = await service.latestBulletinPublic({
      from: "2026-10-18T00:00:00.000Z",
      to: "2026-10-25T00:00:00.000Z"
    });

    expect(selected?.id).toBe("weekly-bulletin");
    expect(repository.queries.map((query) => query.type).sort()).toEqual([
      "sunday",
      "weekly_bulletin"
    ]);
  });
});

class BulletinProbeRepository extends InMemoryLifePostRepository {
  readonly queries: LifePostListQuery[] = [];

  override async list(query: LifePostListQuery) {
    this.queries.push(query);
    if (query.type === "weekly_bulletin") {
      return [storedPost({ id: "weekly-bulletin", type: "weekly_bulletin" })];
    }
    if (query.type === "sunday") {
      return [];
    }
    return Array.from({ length: query.limit }, (_, index) =>
      storedPost({ id: `event-${index}`, type: "event", sort: 100 })
    );
  }
}

function post(input: {
  id: string;
  type: "weekly_bulletin" | "sunday" | "event";
  sort?: number;
  startsAt?: string;
}) {
  return publicLifePostSchema.parse({
    id: input.id,
    type: input.type,
    title: input.id,
    body: "Body",
    sort: input.sort ?? 0,
    startsAt: input.startsAt ?? null,
    updatedAt: "2026-10-18T16:00:00.000Z"
  });
}

function storedPost(input: {
  id: string;
  type: "weekly_bulletin" | "sunday" | "event";
  sort?: number;
}) {
  return lifePostSchema.parse({
    id: input.id,
    revision: 0,
    type: input.type,
    title: input.id,
    body: "Body",
    sort: input.sort ?? 0,
    visibility: "public",
    status: "published",
    startsAt: "2026-10-18T17:00:00.000Z",
    updatedAt: "2026-10-18T16:00:00.000Z"
  });
}
