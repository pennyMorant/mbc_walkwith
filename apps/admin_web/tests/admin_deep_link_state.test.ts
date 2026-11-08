import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminDeepLinkState.vue", import.meta.url)
).text();

describe("admin deep link state", () => {
  test("owns deep-link loading and retry presentation only", () => {
    expect(component).toContain('v-if="pending"');
    expect(component).toContain('aria-busy="true"');
    expect(component).toContain("<AdminRetryAlert");
    expect(component).toContain("v-else-if=\"errorMessage\"");
    expect(component).toContain("$emit('retry')");
    expect(component).not.toContain("useRoute");
    expect(component).not.toContain("@/core/api");
  });

  test("is shared by every resource deep-link page", async () => {
    const paths = [
      "../src/features/sermons/pages/SermonsPage.vue",
      "../src/features/life-posts/pages/LifePostsPage.vue",
      "../src/features/members/pages/MembersPage.vue"
    ];
    const sources = await Promise.all(
      paths.map((path) => Bun.file(new URL(path, import.meta.url)).text())
    );

    for (const source of sources) {
      expect(source).toContain(
        'import AdminDeepLinkState from "@/core/ui/AdminDeepLinkState.vue"'
      );
      expect(source).toContain("<AdminDeepLinkState");
      expect(source).toContain('@retry="deepLink.retry"');
      expect(source).not.toContain(
        '<v-progress-linear v-if="deepLink.pending.value"'
      );
    }
  });
});
