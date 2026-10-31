<script setup lang="ts">
import type {
  Course,
  CourseEnrollment,
  CourseEnrollmentStatus,
  CourseLesson,
  CourseLessonStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import CourseEnrollmentsPanel from "./CourseEnrollmentsPanel.vue";
import CourseLessonsPanel, { type LessonForm } from "./CourseLessonsPanel.vue";

const lessonForm = defineModel<LessonForm>("lessonForm", { required: true });
const enrollmentStatus = defineModel<CourseEnrollmentStatus | "">(
  "enrollmentStatus",
  { required: true }
);
const enrollmentQuery = defineModel<string>("enrollmentQuery", {
  required: true
});

defineProps<{
  course: Course | null;
  lessons: CourseLesson[];
  enrollments: CourseEnrollment[];
  canManage: boolean;
  canCreateLesson: boolean;
  lessonsPending: boolean;
  enrollmentsPending: boolean;
  lessonPending: boolean;
  lessonStatusPending: boolean;
  enrollmentPending: boolean;
  lessonsErrorMessage: string;
  lessonsRefreshErrorMessage: string;
  enrollmentsErrorMessage: string;
  enrollmentsRefreshErrorMessage: string;
  lessonMutationErrorMessage: string;
  enrollmentMutationErrorMessage: string;
}>();

defineEmits<{
  createLesson: [];
  edit: [];
  retryLessons: [];
  updateLessonStatus: [lesson: CourseLesson, status: CourseLessonStatus];
  refreshEnrollments: [];
  advanceProgress: [enrollment: CourseEnrollment];
  updateEnrollmentStatus: [
    enrollment: CourseEnrollment,
    status: CourseEnrollmentStatus
  ];
}>();

const { t } = useI18n();
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center justify-space-between ga-3">
      <span>{{ course?.title || t("Course") }}</span>
      <v-btn
        v-if="course && canManage"
        icon="mdi-pencil-outline"
        variant="text"
        size="small"
        :aria-label="t('Edit course')"
        @click="$emit('edit')"
      />
    </v-card-title>
    <v-card-subtitle v-if="course">
      {{ course.scheduleText || t("common.notSet") }} ·
      {{ course.location || t("common.notSet") }}
    </v-card-subtitle>
    <v-card-text v-if="!course">
      {{ t("No course selected.") }}
    </v-card-text>
    <template v-else>
      <CourseLessonsPanel
        v-model:lesson-form="lessonForm"
        :lessons="lessons"
        :can-manage="canManage"
        :can-create-lesson="canCreateLesson"
        :lessons-pending="lessonsPending"
        :lesson-pending="lessonPending"
        :lesson-status-pending="lessonStatusPending"
        :error-message="lessonsErrorMessage"
        :refresh-error-message="lessonsRefreshErrorMessage"
        :command-error-message="lessonMutationErrorMessage"
        @create-lesson="$emit('createLesson')"
        @retry="$emit('retryLessons')"
        @update-lesson-status="
          (lesson, status) => $emit('updateLessonStatus', lesson, status)
        "
      />
      <v-divider />
      <CourseEnrollmentsPanel
        v-model:enrollment-status="enrollmentStatus"
        v-model:enrollment-query="enrollmentQuery"
        :course="course"
        :enrollments="enrollments"
        :can-manage="canManage"
        :pending="enrollmentsPending"
        :mutation-pending="enrollmentPending"
        :error-message="enrollmentsErrorMessage"
        :refresh-error-message="enrollmentsRefreshErrorMessage"
        :command-error-message="enrollmentMutationErrorMessage"
        @refresh="$emit('refreshEnrollments')"
        @advance-progress="(enrollment) => $emit('advanceProgress', enrollment)"
        @update-status="
          (enrollment, status) =>
            $emit('updateEnrollmentStatus', enrollment, status)
        "
      />
    </template>
  </v-card>
</template>
