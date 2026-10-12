<script setup lang="ts">
import CourseEditorDrawer from "../components/CourseEditorDrawer.vue";
import CourseWorkspaceCard from "../components/CourseWorkspaceCard.vue";
import { useCoursePageController } from "../composables/use_course_page_controller";

const {
  advanceProgress,
  canCreateLesson,
  canManage,
  canSave,
  courseStatusOptions,
  courses,
  coursesQuery,
  createLesson,
  drawer,
  enrollmentFilters,
  enrollmentMutation,
  enrollments,
  enrollmentsQuery,
  errorMessage,
  filters,
  form,
  lessonForm,
  lessonMutation,
  lessons,
  lessonsQuery,
  lessonStatusMutation,
  newCourse,
  optionItems,
  saveCourse,
  saveMutation,
  selectedCourse,
  selectCourse,
  t,
  updateEnrollmentStatus,
  updateLessonStatus
} = useCoursePageController();
</script>

<template>
  <div>
    <div
      class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
    >
      <div>
        <div class="text-h5 font-weight-bold">{{ t("Courses") }}</div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Manage classes, lessons, enrollments, and learning progress.") }}
        </div>
      </div>
      <v-btn
        v-if="canManage"
        color="primary"
        prepend-icon="mdi-plus"
        @click="newCourse"
      >
        {{ t("New course") }}
      </v-btn>
    </div>

    <v-alert
      v-if="errorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
      density="comfortable"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card class="mt-5" variant="outlined">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="coursesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :label="t('Status')"
              :items="optionItems(['', ...courseStatusOptions])"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.visibility"
              :label="t('Visibility')"
              :items="optionItems(['', 'public', 'members', 'private'])"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="1">
            <v-btn block variant="tonal" @click="coursesQuery.refetch()">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="5">
        <v-card variant="outlined">
          <v-progress-linear
            v-if="coursesQuery.isPending.value"
            indeterminate
            color="primary"
          />
          <v-list lines="three">
            <v-list-item
              v-if="!coursesQuery.isPending.value && courses.length === 0"
            >
              <v-list-item-title class="text-medium-emphasis">
                {{ t("No courses match the current filters.") }}
              </v-list-item-title>
            </v-list-item>
            <v-list-item
              v-for="course in courses"
              :key="course.id"
              :active="selectedCourse?.id === course.id"
              @click="selectCourse(course)"
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
        </v-card>
      </v-col>

      <v-col cols="12" lg="7">
        <CourseWorkspaceCard
          v-model:lesson-form="lessonForm"
          v-model:enrollment-status="enrollmentFilters.status"
          v-model:enrollment-query="enrollmentFilters.query"
          :course="selectedCourse"
          :lessons="lessons"
          :enrollments="enrollments"
          :can-manage="canManage"
          :can-create-lesson="canCreateLesson"
          :lessons-pending="lessonsQuery.isPending.value"
          :enrollments-pending="enrollmentsQuery.isPending.value"
          :lesson-pending="lessonMutation.isPending.value"
          :lesson-status-pending="lessonStatusMutation.isPending.value"
          :enrollment-pending="enrollmentMutation.isPending.value"
          @create-lesson="createLesson"
          @update-lesson-status="updateLessonStatus"
          @refresh-enrollments="enrollmentsQuery.refetch()"
          @advance-progress="advanceProgress"
          @update-enrollment-status="updateEnrollmentStatus"
        />
      </v-col>
    </v-row>

    <CourseEditorDrawer
      v-model="drawer"
      v-model:form="form"
      :course="selectedCourse"
      :can-manage="canManage"
      :can-save="canSave"
      :saving="saveMutation.isPending.value"
      @save="saveCourse"
    />
  </div>
</template>
