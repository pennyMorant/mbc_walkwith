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

  test("routes feature detail drawers through the responsive drawer shell", async () => {
    const component = await Bun.file(
      new URL("../src/core/ui/AdminResponsiveDrawer.vue", import.meta.url)
    ).text();
    const featureRoot = new URL("../src/features", import.meta.url).pathname;
    const paths = [
      ...new Bun.Glob("**/*.vue").scanSync({ cwd: featureRoot, absolute: true })
    ];
    const sources = await Promise.all(paths.map((path) => Bun.file(path).text()));

    expect(component).toContain("max-width: 100vw");
    expect(component).toContain(':width="props.desktopWidth"');
    expect(component).toContain('color="surface"');
    expect(component).toContain("overscroll-behavior: contain");
    expect(sources.some((source) => source.includes("<v-navigation-drawer"))).toBe(false);
    expect(sources.filter((source) => source.includes("<AdminResponsiveDrawer"))).toHaveLength(19);
  });
});
