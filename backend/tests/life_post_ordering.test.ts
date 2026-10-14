import { describe, expect, it } from "vitest";

import { InMemoryLifePostRepository } from "../src/modules/life/in-memory-life-post.repository.js";

describe("life post ordering", () => {
  it("selects the nearest upcoming posts before applying the limit", async () => {
    const repository = new InMemoryLifePostRepository();
    const created = [];
    for (let day = 1; day <= 13; day += 1) {
      created.push(
        await repository.create({
          type: "landing_order_test",
          title: `Event ${day}`,
          body: "Ordering fixture",
          meta: "",
          iconName: "event",
          startsAt: `2099-07-${String(day).padStart(2, "0")}T18:00:00.000Z`,
          endsAt: `2099-07-${String(day).padStart(2, "0")}T20:00:00.000Z`,
          visibility: "private",
          imageUrl: null,
          displayWeight: 13 - day,
          ctaLabel: null,
          ctaUrl: null,
          registrationEnabled: false,
          registrationCapacity: null,
          registrationDeadline: null,
          registrationAllowCancellation: true,
          registrationMaxPartySize: 1,
          status: "draft"
        })
      );
    }

    const listed = await repository.list({
      limit: 12,
      type: "landing_order_test",
      visibility: "private",
      status: "draft",
      sort: "starts_at_asc",
      from: "2099-07-01T00:00:00.000Z"
    });

    expect(listed.map((post) => post.id)).toEqual(
      created.slice(0, 12).map((post) => post.id)
    );
    expect(listed.map((post) => post.id)).not.toContain(created[12]?.id);
  });
});
