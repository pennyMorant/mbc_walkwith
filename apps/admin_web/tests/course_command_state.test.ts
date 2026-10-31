import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const controller = source(
  "../src/features/courses/composables/use_course_page_controller.ts"
);
const queries = source(
  "../src/features/courses/composables/use_course_workspace_queries.ts"
);
const page = source("../src/features/courses/pages/CoursesPage.vue");
const workspace = source(
  "../src/features/courses/components/CourseWorkspaceCard.vue"
);
const editor = source(
  "../src/features/courses/components/CourseEditorDrawer.vue"
);

describe("course command and query state", () => {
  test("keeps existing courses editable and course errors in the editor", () => {
    expect(workspace).toContain("mdi-pencil-outline");
    expect(page).toContain('@edit="drawer = true"');
    expect(editor).toContain("errorMessage");
    expect(page).toContain(':error-message="courseMutationErrorMessage"');
  });

  test("freezes write intents and always refreshes canonical resources", () => {
    expect(controller).toContain("courseSaveIntent(");
    expect(controller).toContain("buildCourseLessonPayload(lessonForm)");
    expect(controller).toContain("sameCourseSaveIntent(");
    expect(controller).toContain("sameCourseLessonPayload(");
    expect(controller).toContain("await invalidateCourseResources(");
  });

  test("keeps lesson and enrollment recovery independently owned", () => {
    expect(queries).toContain("appliedEnrollmentFilters");
    expect(queries).toContain("function applyEnrollmentFilters");
    expect(page).toContain('@retry-lessons="lessonsQuery.refetch()"');
    expect(page).toContain('@refresh-enrollments="applyEnrollmentFilters"');
    expect(page).toContain("lessonMutationErrorMessage");
    expect(page).toContain("enrollmentMutationErrorMessage");
  });
});

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}
