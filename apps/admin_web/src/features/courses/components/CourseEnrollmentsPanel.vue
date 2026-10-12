<script setup lang="ts">
import type {
  Course,
  CourseEnrollment,
  CourseEnrollmentStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

const enrollmentStatus = defineModel<CourseEnrollmentStatus | "">(
  "enrollmentStatus",
  { required: true }
);
const enrollmentQuery = defineModel<string>("enrollmentQuery", {
  required: true
});
defineProps<{
  course: Course;
  enrollments: CourseEnrollment[];
  canManage: boolean;
  pending: boolean;
  mutationPending: boolean;
}>();
defineEmits<{
  refresh: [];
  advanceProgress: [enrollment: CourseEnrollment];
  updateStatus: [
    enrollment: CourseEnrollment,
    status: CourseEnrollmentStatus
  ];
}>();

const { optionItems, t } = useI18n();

function canAdvance(enrollment: CourseEnrollment, lessonCount: number) {
  return (
    enrollment.status === "enrolled" &&
    enrollment.completedLessonCount < lessonCount
  );
}

function canEnroll(enrollment: CourseEnrollment) {
  return enrollment.status === "submitted" || enrollment.status === "waitlisted";
}

function canCancel(enrollment: CourseEnrollment) {
  return ["submitted", "enrolled", "waitlisted"].includes(enrollment.status);
}
</script>

<template>
  <v-card-text>
    <div class="d-flex flex-column flex-md-row ga-2 mb-2">
      <div class="text-subtitle-2 flex-grow-1 align-self-md-center">
        {{ t("Enrollments") }}
      </div>
      <v-text-field
        v-model="enrollmentQuery"
        :label="t('Search enrollments')"
        density="compact"
        variant="outlined"
        hide-details
        max-width="240"
        @keyup.enter="$emit('refresh')"
      />
      <v-select
        v-model="enrollmentStatus"
        :items="
          optionItems([
            '',
            'submitted',
            'enrolled',
            'waitlisted',
            'cancelled',
            'completed'
          ])
        "
        :label="t('Status')"
        density="compact"
        variant="outlined"
        hide-details
        max-width="180"
      />
      <v-btn variant="tonal" @click="$emit('refresh')">
        {{ t("common.refresh") }}
      </v-btn>
    </div>
    <v-progress-linear
      v-if="pending"
      indeterminate
      color="primary"
      class="mb-2"
    />
    <v-table density="compact">
      <thead>
        <tr>
          <th>{{ t("Member") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Progress") }}</th>
          <th class="text-right">{{ t("common.actions") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!pending && enrollments.length === 0">
          <td colspan="4" class="text-medium-emphasis py-4">
            {{ t("No enrollments match the current filters.") }}
          </td>
        </tr>
        <tr v-for="enrollment in enrollments" :key="enrollment.id">
          <td>
            <div class="font-weight-medium">
              {{ enrollment.memberDisplayName }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ enrollment.memberEmail }}
            </div>
          </td>
          <td>{{ t(enrollment.status) }}</td>
          <td>{{ enrollment.completedLessonCount }}/{{ course.lessonCount }}</td>
          <td class="text-right">
            <v-btn
              v-if="canManage && canAdvance(enrollment, course.lessonCount)"
              size="small"
              variant="tonal"
              :disabled="mutationPending"
              :loading="mutationPending"
              @click="$emit('advanceProgress', enrollment)"
            >
              {{ t("Progress +1") }}
            </v-btn>
            <v-btn
              v-if="canManage && canEnroll(enrollment)"
              size="small"
              variant="tonal"
              :disabled="mutationPending"
              @click="$emit('updateStatus', enrollment, 'enrolled')"
            >
              {{ t("Enroll") }}
            </v-btn>
            <v-btn
              v-if="canManage && enrollment.status === 'submitted'"
              size="small"
              variant="text"
              :disabled="mutationPending"
              @click="$emit('updateStatus', enrollment, 'waitlisted')"
            >
              {{ t("Waitlist") }}
            </v-btn>
            <v-btn
              v-if="canManage && enrollment.status === 'enrolled'"
              size="small"
              variant="text"
              :disabled="mutationPending"
              @click="$emit('updateStatus', enrollment, 'completed')"
            >
              {{ t("Complete") }}
            </v-btn>
            <v-btn
              v-if="canManage && canCancel(enrollment)"
              size="small"
              variant="text"
              :disabled="mutationPending"
              @click="$emit('updateStatus', enrollment, 'cancelled')"
            >
              {{ t("Cancel") }}
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card-text>
</template>
