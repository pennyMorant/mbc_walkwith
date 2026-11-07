import { describe, expect, test } from "bun:test";

const component = await Bun.file(
  new URL("../src/core/ui/AdminDataState.vue", import.meta.url)
).text();

describe("admin data state", () => {
  test("owns stable loading, error, and empty presentation", () => {
    expect(component).toContain("admin-data-state__pending");
    expect(component).toContain("<v-progress-circular");
    expect(component).toContain("AdminRetryAlert");
    expect(component).toContain("admin-data-state__empty");
    expect(component).toContain("<slot v-else />");
    expect(component).not.toContain("@/core/api/");
  });
});
