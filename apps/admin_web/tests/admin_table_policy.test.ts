import { describe, expect, test } from "bun:test";

const featureRoot = new URL("../src/features/", import.meta.url).pathname;
const componentPaths = await Array.fromAsync(
  new Bun.Glob("**/*.vue").scan({ cwd: featureRoot, absolute: true })
);
const components = await Promise.all(
  componentPaths.map(async (path) => ({
    path,
    source: await Bun.file(path).text()
  }))
);

describe("admin table policy", () => {
  test("pairs every desktop table with a mobile projection", () => {
    const tableComponents = components.filter(({ source }) =>
      source.includes("<v-table")
    );

    expect(tableComponents.length).toBeGreaterThan(0);
    for (const { path, source } of tableComponents) {
      expect(
        /AdminResponsiveTable|d-md-none|AdminMobile(?:DataRow|Record)/.test(
          source
        ),
        `${path} needs a mobile table projection`
      ).toBe(true);
    }
  });

  test("routes whole-row activation through the accessible shared row", () => {
    for (const { path, source } of components) {
      expect(
        source,
        `${path} must not attach pointer behavior directly to a table row`
      ).not.toMatch(/<tr\b[^>]*@click/);
    }
  });

  test("does not expose private object storage identifiers in feature UI", () => {
    for (const { path, source } of components) {
      expect(
        source,
        `${path} must consume a safe API projection instead of storage internals`
      ).not.toMatch(/pdfObjectKey|storagePath|storageKey|objectKey/);
    }
  });
});
