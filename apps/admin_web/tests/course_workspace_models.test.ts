import { describe, expect, test } from "bun:test";

import {
  buildCoursePayload,
  clampLessonCount,
  courseCatalogFilterSnapshot,
  createCourseCatalogFilterForm,
  dateTimeInputToIso,
  emptyCourseForm,
  emptyLessonForm,
  normalizeCapacity,
  resetCourseCatalogFilterForm
} from "../src/features/courses/course_workspace_models";

describe("course workspace models", () => {
  test("keeps course catalog drafts separate from applied filters", () => {
    const form = createCourseCatalogFilterForm();
    const identity = form;
    form.query = "  discipleship  ";
    form.visibility = "members";

    expect(courseCatalogFilterSnapshot(form)).toEqual({
      query: "discipleship",
      status: "",
      visibility: "members"
    });
    expect(form.query).toBe("  discipleship  ");

    resetCourseCatalogFilterForm(form);
    expect(form).toBe(identity);
    expect(form).toEqual(createCourseCatalogFilterForm());
  });

  test("resets course-scoped forms without retaining another course", () => {
    expect(emptyCourseForm()).toMatchObject({
      title: "",
      status: "draft",
      capacity: null
    });
    expect(emptyLessonForm(4)).toMatchObject({
      title: "",
      status: "scheduled",
      position: 4
    });
  });

  test("normalizes editor values into stable API intents", () => {
    expect(
      buildCoursePayload({
        ...emptyCourseForm(),
        title: "  Foundations  ",
        description: "  Course description  ",
        capacity: 12.9
      })
    ).toMatchObject({
      title: "Foundations",
      description: "Course description",
      capacity: 12
    });
    expect(normalizeCapacity(0)).toBeNull();
    expect(dateTimeInputToIso("invalid")).toBeNull();
    expect(dateTimeInputToIso("2026-07-12T10:00")).toContain("2026-07-12");
    expect(clampLessonCount(8, 4)).toBe(4);
    expect(clampLessonCount(-1, 4)).toBe(0);
  });
});
