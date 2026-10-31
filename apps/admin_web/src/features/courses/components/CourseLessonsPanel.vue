<script setup lang="ts">
import type {
  CourseLesson,
  CourseLessonStatus
} from "@mbc/api-contracts";

import { lessonStatusOptions } from "@/core/api/courses";
import { useI18n } from "@/core/i18n/i18n";
import { formatCourseDateTime } from "../course_presenters";

export type LessonForm = {
  title: string;
  description: string;
  startsAt: string;
  status: CourseLessonStatus;
  position: number;
};

const lessonForm = defineModel<LessonForm>("lessonForm", { required: true });
defineProps<{
  lessons: CourseLesson[];
  canManage: boolean;
  canCreateLesson: boolean;
  lessonsPending: boolean;
  lessonPending: boolean;
  lessonStatusPending: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  commandErrorMessage: string;
}>();
defineEmits<{
  createLesson: [];
  retry: [];
  updateLessonStatus: [lesson: CourseLesson, status: CourseLessonStatus];
}>();

const { locale, optionItems, t } = useI18n();
</script>

<template>
  <v-card-text>
    <div class="text-subtitle-2 mb-2">{{ t("Lessons") }}</div>
    <v-alert
      v-if="errorMessage || refreshErrorMessage"
      :type="errorMessage ? 'error' : 'warning'"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="d-flex align-center justify-space-between ga-3">
        <span>{{ errorMessage || refreshErrorMessage }}</span>
        <v-btn size="small" variant="tonal" @click="$emit('retry')">
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
      v-if="lessonsPending"
      indeterminate
      color="primary"
      class="mb-2"
    />
    <v-list v-if="!errorMessage" density="compact" class="border rounded">
      <v-list-item v-if="!lessonsPending && lessons.length === 0">
        <v-list-item-title class="text-medium-emphasis">
          {{ t("No lessons yet.") }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item v-for="lesson in lessons" :key="lesson.id">
        <v-list-item-title>{{ lesson.title }}</v-list-item-title>
        <v-list-item-subtitle>
          {{
            lesson.startsAt
              ? formatCourseDateTime(lesson.startsAt, locale)
              : t("common.notSet")
          }}
          · {{ t(lesson.status) }}
        </v-list-item-subtitle>
        <div v-if="lesson.description" class="text-caption text-medium-emphasis">
          {{ lesson.description }}
        </div>
        <template #append>
          <v-btn
            v-if="canManage && lesson.status === 'scheduled'"
            size="small"
            variant="tonal"
            :disabled="lessonStatusPending"
            :loading="lessonStatusPending"
            @click="$emit('updateLessonStatus', lesson, 'published')"
          >
            {{ t("Publish") }}
          </v-btn>
          <v-btn
            v-if="canManage && lesson.status !== 'completed'"
            size="small"
            variant="text"
            :disabled="lessonStatusPending"
            @click="$emit('updateLessonStatus', lesson, 'completed')"
          >
            {{ t("Complete") }}
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-row v-if="canManage" class="mt-4" dense>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="lessonForm.title"
          :label="t('Lesson title')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="lessonForm.status"
          :label="t('Status')"
          :items="optionItems(lessonStatusOptions)"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          v-model.number="lessonForm.position"
          :label="t('Order')"
          type="number"
          min="0"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn
          block
          color="primary"
          :disabled="!canCreateLesson || lessonPending"
          :loading="lessonPending"
          @click="$emit('createLesson')"
        >
          {{ t("Add") }}
        </v-btn>
      </v-col>
      <v-col cols="12" md="7">
        <v-text-field
          v-model="lessonForm.description"
          :label="t('Description')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="lessonForm.startsAt"
          :label="t('Starts at')"
          type="datetime-local"
          density="compact"
          variant="outlined"
        />
      </v-col>
    </v-row>
  </v-card-text>
</template>
