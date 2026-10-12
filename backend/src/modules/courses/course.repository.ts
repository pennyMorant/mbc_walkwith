import type {
  Course,
  CourseEnrollment,
  CourseEnrollmentListQuery,
  CourseEnrollmentRequest,
  CourseEnrollmentStatus,
  CourseEnrollmentUpdateRequest,
  CourseLesson,
  CourseLessonUpdateRequest,
  CourseLessonUpsertRequest,
  CourseListQuery,
  CourseUpdateRequest,
  CourseUpsertRequest
} from "@mbc/api-contracts";

export interface CourseRepository {
  list(query: CourseListQuery): Promise<Course[]>;
  listForMember(query: CourseListQuery, userId: string): Promise<Course[]>;
  listForPublic(query: CourseListQuery): Promise<Course[]>;
  listMine(userId: string): Promise<Course[]>;
  getById(id: string): Promise<Course | null>;
  getByIdForMember(id: string, userId: string): Promise<Course | null>;
  getByIdForPublic(id: string): Promise<Course | null>;
  create(input: CourseUpsertRequest): Promise<Course>;
  update(
    id: string,
    input: CourseUpdateRequest,
    validate: CourseUpdateValidator
  ): Promise<Course | null>;
  listLessons(courseId: string): Promise<CourseLesson[]>;
  createLesson(
    courseId: string,
    input: CourseLessonUpsertRequest
  ): Promise<CourseLesson>;
  updateLesson(
    courseId: string,
    lessonId: string,
    input: CourseLessonUpdateRequest,
    validate: CourseLessonUpdateValidator
  ): Promise<CourseLesson | null>;
  listEnrollments(
    courseId: string,
    query: CourseEnrollmentListQuery
  ): Promise<CourseEnrollment[]>;
  getEnrollmentById(
    courseId: string,
    enrollmentId: string
  ): Promise<CourseEnrollment | null>;
  enroll(
    input: CourseEnrollmentCreateInput,
    decideStatus: CourseEnrollmentStatusDecision
  ): Promise<CourseEnrollmentAttempt | null>;
  updateEnrollment(
    courseId: string,
    enrollmentId: string,
    input: CourseEnrollmentUpdateRequest,
    decide: CourseEnrollmentUpdateDecision
  ): Promise<CourseEnrollment | null>;
  countEnrolled(courseId: string): Promise<number>;
}

export type CourseEnrollmentCreateInput = CourseEnrollmentRequest & {
  courseId: string;
  userId: string;
  memberDisplayName: string;
  memberEmail: string;
};

export type CourseEnrollmentDecisionContext = {
  status: Course["status"];
  visibility: Course["visibility"];
  capacity: number | null;
  enrolledCount: number;
};

export type CourseEnrollmentStatusDecision = (
  context: CourseEnrollmentDecisionContext
) => CourseEnrollmentStatus;

export type CourseEnrollmentAttempt = {
  enrollment: CourseEnrollment;
  created: boolean;
};

export type CourseUpdateContext = {
  status: Course["status"];
  enrolledCount: number;
};

export type CourseUpdateValidator = (context: CourseUpdateContext) => void;

export type CourseLessonUpdateContext = {
  status: CourseLesson["status"];
};

export type CourseLessonUpdateValidator = (
  context: CourseLessonUpdateContext
) => void;

export type CourseEnrollmentUpdateContext = {
  courseStatus: Course["status"];
  capacity: number | null;
  enrolledCount: number;
  lessonCount: number;
  enrollment: CourseEnrollment;
};

export type CourseEnrollmentCanonicalUpdate = {
  status: CourseEnrollmentStatus;
  completedLessonCount: number;
};

export type CourseEnrollmentUpdateDecision = (
  context: CourseEnrollmentUpdateContext
) => CourseEnrollmentCanonicalUpdate;
