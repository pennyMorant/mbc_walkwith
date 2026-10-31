<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminCatalogFilters from "@/core/ui/AdminCatalogFilters.vue";

import CourseCatalogCard from "../components/CourseCatalogCard.vue";
import CourseEditorDrawer from "../components/CourseEditorDrawer.vue";
import CourseWorkspaceCard from "../components/CourseWorkspaceCard.vue";
import { useCoursePageController } from "../composables/use_course_page_controller";

const {
  advanceProgress,
  applyEnrollmentFilters,
  applyCourseFilters,
  canCreateLesson,
  canManage,
  canSave,
  clearCourseFilters,
  courseStatusOptions,
  courseMutationErrorMessage,
  courses,
  coursesQuery,
  createLesson,
  drawer,
  enrollmentFilters,
  enrollmentMutationErrorMessage,
  enrollmentMutation,
  enrollments,
  enrollmentsErrorMessage,
  enrollmentsQuery,
  enrollmentsRefreshErrorMessage,
  filters,
  form,
  lessonForm,
  lessonMutationErrorMessage,
  lessonMutation,
  lessons,
  lessonsErrorMessage,
  lessonsQuery,
  lessonsRefreshErrorMessage,
  lessonStatusMutation,
  listErrorMessage,
  listRefreshErrorMessage,
  newCourse,
  optionItems,
  saveCourse,
  saveMutation,
  refreshCourses,
  selectedCourse,
  selectCourse,
  t,
  updateEnrollmentStatus,
  updateLessonStatus
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

    <AdminCatalogFilters
      v-model:query="filters.query"
      v-model:status="filters.status"
      v-model:visibility="filters.visibility"
      :status-items="optionItems(['', ...courseStatusOptions])"
      :visibility-items="optionItems(['', 'public', 'members', 'private'])"
      :fetching="coursesQuery.isFetching.value"
      @apply="applyCourseFilters"
      @clear="clearCourseFilters"
    />

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="5">
        <CourseCatalogCard
          :courses="courses"
          :error-message="listErrorMessage"
          :refresh-error-message="listRefreshErrorMessage"
          :pending="coursesQuery.isPending.value"
          :selected-course-id="selectedCourse?.id ?? null"
          @retry="refreshCourses"
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
          :lessons-error-message="lessonsErrorMessage"
          :lessons-refresh-error-message="lessonsRefreshErrorMessage"
          :enrollments-error-message="enrollmentsErrorMessage"
          :enrollments-refresh-error-message="enrollmentsRefreshErrorMessage"
          :lesson-mutation-error-message="lessonMutationErrorMessage"
          :enrollment-mutation-error-message="enrollmentMutationErrorMessage"
          @create-lesson="createLesson"
          @edit="drawer = true"
          @retry-lessons="lessonsQuery.refetch()"
          @update-lesson-status="updateLessonStatus"
          @refresh-enrollments="applyEnrollmentFilters"
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
      :error-message="courseMutationErrorMessage"
      @save="saveCourse"
    />
  </div>
</template>
