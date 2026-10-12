import type { Course } from "@mbc/api-contracts";
import { describe, expect, test } from "bun:test";
import { ref } from "vue";

import { useCourseMutationFeedback } from "../src/features/courses/composables/use_course_mutation_feedback";

describe("course mutation feedback", () => {
  test("ignores late failures and results from another course", () => {
    const selectedCourse = ref<Course | null>(course("course-a"));
    const feedback = useCourseMutationFeedback(selectedCourse, (key) => key);
    const first = feedback.begin("lesson-create");

    feedback.capture(new Error("first failure"), undefined, first);
    expect(feedback.errorMessage.value).toBe("first failure");

    const newer = feedback.begin("lesson-create");
    feedback.capture(new Error("late failure"), undefined, first);
    expect(feedback.errorMessage.value).toBe("");
    expect(feedback.isCurrent(newer)).toBe(true);

    const enrollment = feedback.begin("enrollment");
    expect(feedback.isCurrent(newer)).toBe(true);
    expect(feedback.isCurrent(enrollment)).toBe(true);

    selectedCourse.value = course("course-b");
    feedback.reset();
    feedback.capture(new Error("wrong course"), undefined, newer);
    expect(feedback.errorMessage.value).toBe("");
    expect(feedback.isCurrent(newer)).toBe(false);
  });
});

function course(id: string): Course {
  return {
    id,
    title: id,
    description: "",
    teacherName: "",
    location: "",
    scheduleText: "",
    visibility: "members",
    status: "open",
    capacity: null,
    enrolledCount: 0,
    lessonCount: 0,
    myEnrollmentStatus: null,
    myCompletedLessonCount: 0,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    lessons: []
  };
}
