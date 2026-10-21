import { describe, expect, test } from "bun:test";

const memberResults = await Bun.file(
  new URL("../src/features/members/components/MemberResults.vue", import.meta.url)
).text();
const newcomerResults = await Bun.file(
  new URL("../src/features/newcomers/components/NewcomerResults.vue", import.meta.url)
).text();
const careResults = await Bun.file(
  new URL("../src/features/care/components/CareRequestResults.vue", import.meta.url)
).text();

describe("people workspace responsive results", () => {
  test.each([
    ["members", memberResults, 'v-for="member in members"'],
    ["newcomers", newcomerResults, 'v-for="newcomer in newcomers"'],
    ["care", careResults, 'v-for="request in requests"']
  ])("keeps %s desktop and mobile projections presentation-only", (_, source, loop) => {
    expect(source).toContain("d-none d-md-block");
    expect(source).toContain("d-md-none");
    expect(source.match(new RegExp(loop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))).toHaveLength(2);
    expect(source).toContain("$emit('open'");
    expect(source).not.toContain("@/core/api");
    expect(source).not.toContain("auth_store");
  });
});
