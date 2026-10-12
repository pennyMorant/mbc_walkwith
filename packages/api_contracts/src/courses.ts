import { visibilityLevels } from "@mbc/shared-types";
import { z } from "zod";

export const courseStatusSchema = z.enum([
  "draft",
  "open",
  "closed",
  "in_progress",
  "completed",
  "archived"
]);

export const courseLessonStatusSchema = z.enum([
  "scheduled",
  "published",
  "completed"
]);

export const courseEnrollmentStatusSchema = z.enum([
  "submitted",
  "enrolled",
  "waitlisted",
  "cancelled",
  "completed"
]);

export const courseLessonSchema = z.object({
  id: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string(),
  startsAt: z.string().datetime().nullable(),
  status: courseLessonStatusSchema,
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const courseSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string(),
    teacherName: z.string(),
    location: z.string(),
    scheduleText: z.string(),
    visibility: z.enum(visibilityLevels),
    status: courseStatusSchema,
    capacity: z.number().int().positive().nullable(),
    enrolledCount: z.number().int().nonnegative(),
    lessonCount: z.number().int().nonnegative(),
    myEnrollmentStatus: courseEnrollmentStatusSchema.nullable(),
    myCompletedLessonCount: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    lessons: z.array(courseLessonSchema)
  })
  .superRefine((course, context) => {
    if (
      course.capacity !== null &&
      course.enrolledCount > course.capacity
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["enrolledCount"],
        message: "enrolledCount must not exceed capacity."
      });
    }
    if (course.lessonCount !== course.lessons.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lessonCount"],
        message: "lessonCount must match lessons."
      });
    }
    if (course.myCompletedLessonCount > course.lessonCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["myCompletedLessonCount"],
        message: "myCompletedLessonCount must not exceed lessonCount."
      });
    }
    if (
      course.myCompletedLessonCount !== 0 &&
      course.myEnrollmentStatus !== "enrolled" &&
      course.myEnrollmentStatus !== "completed"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["myCompletedLessonCount"],
        message: "Only enrolled or completed enrollments can hold progress."
      });
    }
  });

export const courseUpsertRequestSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(3000).default(""),
  teacherName: z.string().trim().max(160).default(""),
  location: z.string().trim().max(200).default(""),
  scheduleText: z.string().trim().max(240).default(""),
  visibility: z.enum(visibilityLevels).default("members"),
  status: courseStatusSchema.default("draft"),
  capacity: z.number().int().positive().nullable().optional()
});

export const courseUpdateRequestSchema = courseUpsertRequestSchema.partial();

export const courseListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: courseStatusSchema.optional(),
  visibility: z.enum(visibilityLevels).optional(),
  query: z.string().trim().min(1).max(120).optional()
});

export const courseLessonUpsertRequestSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).default(""),
  startsAt: z.string().datetime().nullable().optional(),
  status: courseLessonStatusSchema.default("scheduled"),
  sortOrder: z.number().int().nonnegative().default(0)
});

export const courseLessonUpdateRequestSchema =
  courseLessonUpsertRequestSchema.partial();

export const courseEnrollmentSchema = z.object({
  id: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  memberDisplayName: z.string().trim().min(1),
  memberEmail: z.string().email(),
  status: courseEnrollmentStatusSchema,
  note: z.string(),
  completedLessonCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
}).superRefine((enrollment, context) => {
  if (
    enrollment.completedLessonCount !== 0 &&
    enrollment.status !== "enrolled" &&
    enrollment.status !== "completed"
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["completedLessonCount"],
      message: "Only enrolled or completed enrollments can hold progress."
    });
  }
});

export const courseEnrollmentRequestSchema = z.object({
  note: z.string().trim().max(500).optional()
});

export const courseEnrollmentUpdateRequestSchema = z
  .object({
    status: courseEnrollmentStatusSchema.optional(),
    completedLessonCount: z.number().int().nonnegative().optional()
  })
  .refine(
    (input) =>
      input.status !== undefined || input.completedLessonCount !== undefined,
    { message: "At least one enrollment field is required." }
  );

export const courseEnrollmentListQuerySchema = z.object({
  status: courseEnrollmentStatusSchema.optional(),
  query: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const courseListResponseSchema = z.object({
  items: z.array(courseSchema)
});

export const courseLessonListResponseSchema = z.object({
  items: z.array(courseLessonSchema)
});

export const courseEnrollmentListResponseSchema = z.object({
  items: z.array(courseEnrollmentSchema)
});

export type CourseStatus = z.infer<typeof courseStatusSchema>;
export type CourseLessonStatus = z.infer<typeof courseLessonStatusSchema>;
export type CourseEnrollmentStatus = z.infer<
  typeof courseEnrollmentStatusSchema
>;
export type Course = z.infer<typeof courseSchema>;
export type CourseUpsertRequest = z.infer<typeof courseUpsertRequestSchema>;
export type CourseUpdateRequest = z.infer<typeof courseUpdateRequestSchema>;
export type CourseListQuery = z.infer<typeof courseListQuerySchema>;
export type CourseLesson = z.infer<typeof courseLessonSchema>;
export type CourseLessonUpsertRequest = z.infer<
  typeof courseLessonUpsertRequestSchema
>;
export type CourseLessonUpdateRequest = z.infer<
  typeof courseLessonUpdateRequestSchema
>;
export type CourseEnrollment = z.infer<typeof courseEnrollmentSchema>;
export type CourseEnrollmentRequest = z.infer<
  typeof courseEnrollmentRequestSchema
>;
export type CourseEnrollmentUpdateRequest = z.infer<
  typeof courseEnrollmentUpdateRequestSchema
>;
export type CourseEnrollmentListQuery = z.infer<
  typeof courseEnrollmentListQuerySchema
>;
export type CourseListResponse = z.infer<typeof courseListResponseSchema>;
export type CourseLessonListResponse = z.infer<
  typeof courseLessonListResponseSchema
>;
export type CourseEnrollmentListResponse = z.infer<
  typeof courseEnrollmentListResponseSchema
>;
