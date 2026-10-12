import { describe, expect, test } from "bun:test";

import { formatCourseDateTime } from "../src/features/courses/course_presenters";

describe("course presenters", () => {
  test("formats valid lesson times and preserves invalid values", () => {
    expect(
      formatCourseDateTime("2026-07-12T17:00:00.000Z", "en-US")
    ).toContain("2026");
    expect(formatCourseDateTime("invalid", "en-US")).toBe("invalid");
    expect(formatCourseDateTime(null, "en-US")).toBe("");
  });
});
