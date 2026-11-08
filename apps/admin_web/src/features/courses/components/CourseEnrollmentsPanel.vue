<script setup lang="ts">
import type {
  Course,
  CourseEnrollment,
  CourseEnrollmentStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

import CourseEnrollmentActions from "./CourseEnrollmentActions.vue";

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
  pendingEnrollmentId: string | null;
  pendingEnrollmentStatus: CourseEnrollmentStatus | null;
  errorMessage: string;
  refreshErrorMessage: string;
  commandErrorMessage: string;
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
    <v-alert
      v-if="errorMessage || refreshErrorMessage"
      :type="errorMessage ? 'error' : 'warning'"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="d-flex align-center justify-space-between ga-3">
        <span>{{ errorMessage || refreshErrorMessage }}</span>
        <v-btn size="small" variant="tonal" @click="$emit('refresh')">
          {{ t("Retry") }}
        </v-btn>
      </div>
    </v-alert>
    <v-alert
      v-if="commandErrorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ commandErrorMessage }}
    </v-alert>
    <v-progress-linear
      v-if="pending"
      indeterminate
      color="primary"
      class="mb-2"
    />
    <AdminResponsiveTable v-if="!errorMessage">
      <template #desktop>
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
                <div class="font-weight-medium">{{ enrollment.memberDisplayName }}</div>
                <div class="text-caption text-medium-emphasis">{{ enrollment.memberEmail }}</div>
              </td>
              <td>{{ t(enrollment.status) }}</td>
              <td>{{ enrollment.completedLessonCount }}/{{ course.lessonCount }}</td>
              <td>
                <CourseEnrollmentActions
                  :enrollment="enrollment"
                  :lesson-count="course.lessonCount"
                  :can-manage="canManage"
                  :mutation-pending="mutationPending"
                  :pending-enrollment-id="pendingEnrollmentId"
                  :pending-enrollment-status="pendingEnrollmentStatus"
                  @advance-progress="$emit('advanceProgress', enrollment)"
                  @update-status="(status) => $emit('updateStatus', enrollment, status)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </template>
      <template #mobile>
        <div v-if="!pending && enrollments.length === 0" class="text-medium-emphasis py-4">
          {{ t("No enrollments match the current filters.") }}
        </div>
        <AdminMobileDataRow v-for="enrollment in enrollments" :key="enrollment.id">
          <strong>{{ enrollment.memberDisplayName }}</strong>
          <span>{{ enrollment.memberEmail }}</span>
          <template #trailing>
            <v-chip size="small">{{ t(enrollment.status) }}</v-chip>
          </template>
          <template #meta>
            <span>{{ t("Progress") }}: {{ enrollment.completedLessonCount }}/{{ course.lessonCount }}</span>
          </template>
          <template #actions>
            <CourseEnrollmentActions
              :enrollment="enrollment"
              :lesson-count="course.lessonCount"
              :can-manage="canManage"
              :mutation-pending="mutationPending"
              :pending-enrollment-id="pendingEnrollmentId"
              :pending-enrollment-status="pendingEnrollmentStatus"
              @advance-progress="$emit('advanceProgress', enrollment)"
              @update-status="(status) => $emit('updateStatus', enrollment, status)"
            />
          </template>
        </AdminMobileDataRow>
      </template>
    </AdminResponsiveTable>
  </v-card-text>
</template>
