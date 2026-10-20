import { describe, expect, test } from "bun:test";

describe("admin responsive shell", () => {
  test("reuses command search in the mobile drawer", async () => {
    const [shell, commandSearch] = await Promise.all([
      Bun.file(new URL("../src/layouts/AdminShell.vue", import.meta.url)).text(),
      Bun.file(
        new URL(
          "../src/core/navigation/AdminCommandSearch.vue",
          import.meta.url
        )
      ).text()
    ]);

    expect(shell.match(/<AdminCommandSearch/g)?.length).toBe(2);
    expect(shell).toContain('v-if="mobile" class="px-4 pb-4"');
    expect(shell).toContain("fluid");
    expect(shell).toContain('v-if="!mobile"');
    expect(commandSearch).toContain("fluid?: boolean");
    expect(commandSearch).toContain("admin-command-search--fluid");
  });

  test("keeps one recent-content collection with responsive presentations", async () => {
    const recentContent = await Bun.file(
      new URL(
        "../src/features/dashboard/components/DashboardRecentContent.vue",
        import.meta.url
      )
    ).text();

    expect(recentContent).toContain("dashboard-recent d-none d-md-block");
    expect(recentContent).toContain("dashboard-recent-mobile d-md-none");
    expect(recentContent.match(/v-for="item in items"/g)?.length).toBe(2);
    expect(recentContent.match(/\$emit\('open', item.path\)/g)?.length).toBe(2);
  });
});
