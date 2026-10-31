import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../src/features/life-posts/pages/LifePostsPage.vue", import.meta.url),
  "utf8"
);
const registrationQuerySource = readFileSync(
  new URL(
    "../src/features/life-posts/composables/use_life_event_registrations.ts",
    import.meta.url
  ),
  "utf8"
);

const presentationalSources = [
  "LifePostDetailsFields.vue",
  "LifePostPublishChecklist.vue",
  "LifePostNotificationPanel.vue"
].map((fileName) =>
  readFileSync(
    new URL(`../src/features/life-posts/components/${fileName}`, import.meta.url),
    "utf8"
  )
);

describe("life post editor composition", () => {
  it("keeps the page responsible for remote operations and permissions", () => {
    expect(pageSource).toContain("useLifePostsPageController");
    expect(pageSource).toContain("translateLifePostNotification");
    expect(pageSource).toContain("authStore.can");
    expect(pageSource).toContain("publishMutation");
  });

  it("routes registration writes through controller intents", () => {
    expect(pageSource).not.toContain("RegistrationMutation.mutate");
    expect(pageSource).toContain('@create-check-in-code="createCheckInCode(false)"');
    expect(pageSource).toContain('@save-create="createRegistration"');
    expect(pageSource).toContain('@save-edit="updateRegistration"');
  });

  it("guards editor commands as one async ownership boundary", () => {
    expect(pageSource).toContain(':command-pending="lifePostCommandPending"');
    expect(pageSource).toContain(':initial-error-message="registrationInitialErrorMessage"');
    expect(pageSource).toContain(':refresh-error-message="registrationRefreshErrorMessage"');
    expect(pageSource).toContain(':command-error-message="registrationCommandErrorMessage"');
  });

  it("executes registration reads from the frozen query key", () => {
    expect(registrationQuerySource).toContain("queryFn: ({ queryKey })");
    expect(registrationQuerySource).toContain(
      "listEventRegistrations(postId, query)"
    );
  });

  it("composes the editor from focused presentation components", () => {
    expect(pageSource).toContain("<LifePostDetailsFields");
    expect(pageSource).toContain("<LifePostPublishChecklist");
    expect(pageSource).toContain("<LifePostNotificationPanel");
  });

  it("keeps API and auth ownership out of presentation components", () => {
    for (const source of presentationalSources) {
      expect(source).not.toContain("@/core/api/");
      expect(source).not.toContain("auth_store");
      expect(source).not.toContain("useAuthStore");
    }
  });
});
