import { describe, expect, it } from "vitest";

describe("admin build splitting", () => {
  it("loads every route page asynchronously", async () => {
    const router = await Bun.file(
      new URL("../src/router.ts", import.meta.url)
    ).text();
    const routeComponents = [...router.matchAll(/component:\s*([^,\n]+)/g)].map(
      (match) => match[1]?.trim()
    );

    expect(routeComponents).toHaveLength(24);
    expect(routeComponents.every((component) => component?.startsWith("() => import("))).toBe(true);
    expect(router).not.toMatch(/import\s+\w+Page\s+from/);
  });

  it("keeps stable third-party dependencies in explicit vendor chunks", async () => {
    const config = await Bun.file(
      new URL("../vite.config.ts", import.meta.url)
    ).text();

    expect(config).toContain('"vue-framework"');
    expect(config).toContain('"content-tools"');
    expect(config).toContain('"admin-i18n"');
    expect(config).toContain("vuetify: [\"vuetify\"]");
  });
});
