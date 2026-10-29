<script setup lang="ts">
import type { Course } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{
  courses: Course[];
  errorMessage: string;
  refreshErrorMessage: string;
  pending: boolean;
  selectedCourseId: string | null;
}>();

defineEmits<{
  retry: [];
  select: [course: Course];
}>();

const { t } = useI18n();
</script>

<template>
  <v-card variant="outlined">
    <v-alert
      v-if="refreshErrorMessage"
      type="warning"
      variant="tonal"
      class="ma-4"
    >
      <div
        class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
      >
        <span>{{ t("courses.refreshFailed") }} {{ refreshErrorMessage }}</span>
        <v-btn
          color="warning"
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          @click="$emit('retry')"
        >
          {{ t("Retry") }}
        </v-btn>
      </div>
    </v-alert>
    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="courses.length === 0"
      :empty-title="t('No courses match the current filters.')"
      empty-icon="mdi-school-outline"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-list lines="three">
        <v-list-item
          v-for="course in courses"
          :key="course.id"
          :active="selectedCourseId === course.id"
          @click="$emit('select', course)"
        >
          <template #title>
            <div class="font-weight-bold">{{ course.title }}</div>
          </template>
          <template #subtitle>
            <div>{{ course.teacherName || t("common.notSet") }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ course.scheduleText || t("common.notSet") }} ·
              {{ t(course.status) }} ·
              {{ course.enrolledCount }}/{{ course.capacity ?? "∞" }}
            </div>
          </template>
        </v-list-item>
      </v-list>
    </AdminDataState>
  </v-card>
</template>
