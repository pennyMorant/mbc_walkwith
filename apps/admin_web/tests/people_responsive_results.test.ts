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
const messages = await Bun.file(
  new URL("../src/core/i18n/i18n.ts", import.meta.url)
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
    expect(source).toContain("AdminDataState");
    expect(source).toContain("$emit('retry')");
    expect(source).not.toContain("@/core/api");
    expect(source).not.toContain("auth_store");
  });

  test.each([
    ["members", "../src/features/members/pages/MembersPage.vue", "membersQuery"],
    ["newcomers", "../src/features/newcomers/pages/NewcomersPage.vue", "newcomersQuery"],
    ["care", "../src/features/care/pages/CarePage.vue", "requestsQuery"]
  ])("keeps %s retry ownership in its page", async (_, path, query) => {
    const page = await Bun.file(new URL(path, import.meta.url)).text();
    expect(page).toContain(`@retry="${query}.refetch()"`);
  });

  test("localizes the care empty state in every supported locale", () => {
    expect(messages.match(/care\.empty/g)).toHaveLength(4);
    expect(careResults).toContain("t('care.empty')");
  });
});
