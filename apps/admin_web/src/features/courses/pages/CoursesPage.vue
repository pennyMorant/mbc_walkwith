<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import CourseCatalogCard from "../components/CourseCatalogCard.vue";
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
  filters,
  form,
  lessonForm,
  lessonMutation,
  lessons,
  lessonsQuery,
  lessonStatusMutation,
  listErrorMessage,
  newCourse,
  optionItems,
  saveCourse,
  saveMutation,
  selectedCourse,
  selectCourse,
  t,
  updateEnrollmentStatus,
  updateLessonStatus,
  workspaceErrorMessage
} = useCoursePageController();
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('Courses')"
      :subtitle="t('Manage classes, lessons, enrollments, and learning progress.')"
    >
      <template #actions>
        <v-btn
          v-if="canManage"
          color="primary"
          prepend-icon="mdi-plus"
          @click="newCourse"
        >
          {{ t("New course") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-alert
      v-if="workspaceErrorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
      density="comfortable"
    >
      {{ workspaceErrorMessage }}
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
        <CourseCatalogCard
          :courses="courses"
          :error-message="listErrorMessage"
          :pending="coursesQuery.isPending.value"
          :selected-course-id="selectedCourse?.id ?? null"
          @retry="coursesQuery.refetch()"
          @select="selectCourse"
        />
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
