import {
  lifeLatestBulletinQuerySchema,
  publicLifePostSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { selectLatestBulletin } from "../src/modules/life/life-post.service.js";

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
});

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
