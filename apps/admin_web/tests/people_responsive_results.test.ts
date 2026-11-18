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
    expect(source).toContain("AdminResponsiveTable");
    expect(source).toContain('<template #desktop>');
    expect(source).toContain('<template #mobile>');
    expect(source).not.toContain("d-none d-md-block");
    expect(source).not.toContain("d-md-none");
    expect(source.match(new RegExp(loop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))).toHaveLength(2);
    expect(source).toContain("$emit('open'");
    expect(source).toContain("AdminDataState");
    expect(source).toContain("$emit('retry')");
    expect(source).not.toContain("@/core/api");
    expect(source).not.toContain("auth_store");
  });

  test("keeps member retry ownership in its page", async () => {
    const page = await Bun.file(
      new URL("../src/features/members/pages/MembersPage.vue", import.meta.url)
    ).text();
    expect(page).toContain('@retry="refreshList"');
  });

  test("keeps care retry ownership in its page", async () => {
    const page = await Bun.file(
      new URL("../src/features/care/pages/CarePage.vue", import.meta.url)
    ).text();
    expect(page).toContain('@retry="requestsQuery.refetch()"');
  });

  test("keeps newcomer list retry ownership in its page", async () => {
    const page = await Bun.file(
      new URL("../src/features/newcomers/pages/NewcomersPage.vue", import.meta.url)
    ).text();

    expect(page).toContain('@retry="refreshList"');
  });

  test("localizes the care empty state in every supported locale", () => {
    expect(messages.match(/care\.empty/g)).toHaveLength(4);
    expect(careResults).toContain("t('care.empty')");
  });

  test("localizes sensitive care workflow copy beyond the English fallback", () => {
    expect(messages).toContain("Las notas de cuidado son confidenciales");
    expect(messages).toContain("Seguimientos programados");
    expect(messages).toContain("關懷記錄屬於敏感資訊");
    expect(messages).toContain("已安排跟進");
  });

  test("localizes member profile validation and refresh recovery in every locale", () => {
    expect(messages.match(/members\.yearInvalid/g)).toHaveLength(4);
    expect(messages.match(/members\.refreshFailed/g)).toHaveLength(4);
    expect(messages).toContain("紧急联系人姓名");
    expect(messages).toContain("Teléfono del contacto de emergencia");
  });

  test("keeps member filter and detail recovery page-owned", async () => {
    const [page, editor, listQuery] = await Promise.all([
      Bun.file(
        new URL("../src/features/members/pages/MembersPage.vue", import.meta.url)
      ).text(),
      Bun.file(
        new URL(
          "../src/features/members/components/MemberEditorDrawer.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/members/composables/use_member_list_query.ts",
          import.meta.url
        )
      ).text()
    ]);

    expect(listQuery).toContain("appliedFilters");
    expect(listQuery).toContain("memberFilterSnapshot(filters)");
    expect(page).toContain("AdminFilterToolbar");
    expect(page).toContain('@apply="applyFilters"');
    expect(listQuery).toContain("initialError");
    expect(listQuery).toContain("refreshError");
    expect(page).toContain("detailRequestVersion");
    expect(page).toContain("editorContextVersion");
    expect(page).toContain("captureCommandError");
    expect(page).toContain('@retry="retryMemberDetail"');
    expect(page).toContain("<MemberEditorDrawer");
    expect(editor).not.toContain("@/core/api");
    expect(editor).not.toContain("auth_store");
    expect(editor).toContain(":disabled=\"editorDisabled\"");
  });

  test("keeps complete member profile fields in focused presentation components", async () => {
    const [page, profileFields, notificationFields] = await Promise.all([
      Bun.file(
        new URL("../src/features/members/pages/MembersPage.vue", import.meta.url)
      ).text(),
      Bun.file(
        new URL(
          "../src/features/members/components/MemberProfileFields.vue",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/members/components/MemberNotificationFields.vue",
          import.meta.url
        )
      ).text()
    ]);

    expect(page).toContain("payload: memberPayloadFromForm(form)");
    expect(page).toContain("intent.memberId");
    expect(page).toContain(":refresh-error-message=\"refreshErrorMessage\"");
    expect(profileFields).toContain('v-model="form.address"');
    expect(profileFields).toContain('v-model="form.faithStartYear"');
    expect(profileFields).toContain('v-model="form.emergencyContactPhone"');
    expect(notificationFields).toContain('v-model="form.weeklyBulletin"');
    expect(profileFields).not.toContain("@/core/api");
    expect(notificationFields).not.toContain("@/core/api");
  });

  test("keeps care filter, command, and recovery ownership in its page", async () => {
    const [page, drawer] = await Promise.all([
      Bun.file(
        new URL("../src/features/care/pages/CarePage.vue", import.meta.url)
      ).text(),
      Bun.file(
        new URL(
          "../src/features/care/components/CareRequestDrawer.vue",
          import.meta.url
        )
      ).text()
    ]);

    expect(page).toContain("appliedFilters");
    expect(page).toContain("careFilterSnapshot(filters)");
    expect(page).toContain("AdminFilterToolbar");
    expect(page).toContain('@apply="applyFilters"');
    expect(page).toContain("careContextVersion");
    expect(page).toContain("isCurrentCareContext");
    expect(page).toContain('updateErrorMessage = ref("")');
    expect(page).toContain('followUpErrorMessage = ref("")');
    expect(page).toContain('@retry-assignees="assigneesQuery.refetch()"');
    expect(page).toContain('@retry-follow-ups="followUpsQuery.refetch()"');
    expect(page).toContain("<CareRequestDrawer");
    expect(drawer).toContain("AdminDataState");
    expect(drawer).not.toContain("@/core/api");
    expect(drawer).not.toContain("auth_store");
  });
});
