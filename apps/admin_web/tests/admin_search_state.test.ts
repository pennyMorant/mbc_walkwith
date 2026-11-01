import { describe, expect, test } from "bun:test";

import {
  ADMIN_SEARCH_MIN_LENGTH,
  isCurrentAdminSearchSnapshot,
  normalizeAdminSearchText
} from "../src/core/navigation/admin_search_state";

describe("admin search state", () => {
  test("normalizes surrounding whitespace without changing the query", () => {
    expect(normalizeAdminSearchText("  weekly report  ")).toBe(
      "weekly report"
    );
  });

  test("accepts only a current searchable remote snapshot", () => {
    expect(ADMIN_SEARCH_MIN_LENGTH).toBe(2);
    expect(isCurrentAdminSearchSnapshot(" sermon ", "sermon")).toBe(true);
    expect(isCurrentAdminSearchSnapshot("se", "sermon")).toBe(false);
    expect(isCurrentAdminSearchSnapshot("s", "s")).toBe(false);
    expect(isCurrentAdminSearchSnapshot("", "sermon")).toBe(false);
  });

  test("composable scopes remote data and transport state to the snapshot", async () => {
    const source = await Bun.file(
      new URL(
        "../src/core/navigation/use_admin_search.ts",
        import.meta.url
      )
    ).text();

    expect(source).toContain("queryFn: ({ queryKey }) => searchAdmin(queryKey[1])");
    expect(source).toContain("currentSnapshot.value\n      ? query.data.value?.items");
    expect(source).toContain("currentSnapshot.value ? query.error.value : null");
    expect(source).toContain("currentSnapshot.value && query.isFetching.value");
    expect(source).toContain(
      "normalizedValue.length < ADMIN_SEARCH_MIN_LENGTH"
    );
    expect(source).toContain('debouncedSearchText.value = ""');
  });
});
