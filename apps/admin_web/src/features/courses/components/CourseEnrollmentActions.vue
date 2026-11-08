<script setup lang="ts">
import type {
  CourseEnrollment,
  CourseEnrollmentStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

const props = defineProps<{
  enrollment: CourseEnrollment;
  lessonCount: number;
  canManage: boolean;
  mutationPending: boolean;
  pendingEnrollmentId: string | null;
  pendingEnrollmentStatus: CourseEnrollmentStatus | null;
}>();

defineEmits<{
  advanceProgress: [];
  updateStatus: [status: CourseEnrollmentStatus];
}>();

const { t } = useI18n();

function isPendingAction(status: CourseEnrollmentStatus | null) {
  return (
    props.mutationPending &&
    props.pendingEnrollmentId === props.enrollment.id &&
    props.pendingEnrollmentStatus === status
  );
}

function canAdvance() {
  return (
    props.enrollment.status === "enrolled" &&
    props.enrollment.completedLessonCount < props.lessonCount
  );
}

function canEnroll() {
  return ["submitted", "waitlisted"].includes(props.enrollment.status);
}

function canCancel() {
  return ["submitted", "enrolled", "waitlisted"].includes(
    props.enrollment.status
  );
}
</script>

<template>
  <div class="d-flex flex-wrap justify-end ga-1">
    <v-btn
      v-if="canManage && canAdvance()"
      size="small"
      variant="tonal"
      :disabled="mutationPending"
      :loading="isPendingAction(null)"
      @click="$emit('advanceProgress')"
    >
      {{ t("Progress +1") }}
    </v-btn>
    <v-btn
      v-if="canManage && canEnroll()"
      size="small"
      variant="tonal"
      :disabled="mutationPending"
      :loading="isPendingAction('enrolled')"
      @click="$emit('updateStatus', 'enrolled')"
    >
      {{ t("Enroll") }}
    </v-btn>
    <v-btn
      v-if="canManage && enrollment.status === 'submitted'"
      size="small"
      variant="text"
      :disabled="mutationPending"
      :loading="isPendingAction('waitlisted')"
      @click="$emit('updateStatus', 'waitlisted')"
    >
      {{ t("Waitlist") }}
    </v-btn>
    <v-btn
      v-if="canManage && enrollment.status === 'enrolled'"
      size="small"
      variant="text"
      :disabled="mutationPending"
      :loading="isPendingAction('completed')"
      @click="$emit('updateStatus', 'completed')"
    >
      {{ t("Complete") }}
    </v-btn>
    <v-btn
      v-if="canManage && canCancel()"
      size="small"
      variant="text"
      :disabled="mutationPending"
      :loading="isPendingAction('cancelled')"
      @click="$emit('updateStatus', 'cancelled')"
    >
      {{ t("Cancel") }}
    </v-btn>
  </div>
</template>
