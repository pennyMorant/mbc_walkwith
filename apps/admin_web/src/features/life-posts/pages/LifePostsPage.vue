<script setup lang="ts">
import type { ContentLocale } from "@mbc/api-contracts";
import { ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { getLifePost, translateLifePostNotification } from "@/core/api/life_posts";
import { useAdminResourceDeepLink } from "@/core/navigation/use_admin_resource_deep_link";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import AdminAiDraftPanel from "../../ai/components/AdminAiDraftPanel.vue";
import ContentLocalizationCard from "../../content-localization/components/ContentLocalizationCard.vue";
import LifeEventRegistrationsCard from "../components/LifeEventRegistrationsCard.vue";
import LifePostConfirmDialog from "../components/LifePostConfirmDialog.vue";
import LifePostDetailsFields from "../components/LifePostDetailsFields.vue";
import LifePostEditorActions from "../components/LifePostEditorActions.vue";
import LifePostLibraryCard from "../components/LifePostLibraryCard.vue";
import LifePostNotificationPanel from "../components/LifePostNotificationPanel.vue";
import LifePostPreviewCard from "../components/LifePostPreviewCard.vue";
import LifePostPublishChecklist from "../components/LifePostPublishChecklist.vue";
import { useLifePostsPageController } from "../composables/use_life_posts_page_controller";

const notificationLocale = ref<ContentLocale>("en");
const translatingNotificationLocale = ref<ContentLocale | null>(null);
const notificationLocaleOptions: Array<{ title: string; value: ContentLocale }> = [
  { title: "English", value: "en" },
  { title: "Español", value: "es" },
  { title: "简体中文", value: "zh-Hans" },
  { title: "繁體中文", value: "zh-Hant" }
];

async function translateNotificationTarget(locale: ContentLocale) {
  if (
    translatingNotificationLocale.value ||
    locale === form.sourceLocale ||
    !selectedPost.value
  ) return;
  const title = form.notificationTitle.trim() || form.title.trim();
  const body = form.notificationBody.trim() || form.body.trim();
  if (!title && !body) return;
  translatingNotificationLocale.value = locale;
  try {
    const translated = await translateLifePostNotification(selectedPost.value.id, {
      targetLocale: locale,
      ...(title ? { title } : {}),
      ...(body ? { body } : {})
    });
    form.notificationTranslations[locale] = {
      title: translated.title ?? "",
      body: translated.body ?? ""
    };
  } catch (error) {
    showToast(formatApiErrorMessage(error, t("common.error")), "error");
  } finally {
    translatingNotificationLocale.value = null;
  }
}

const {
  authStore,
  optionItems,
  t,
  selectedPost,
  drawer,
  snackbar,
  confirmDialog,
  lifePostTypes,
  lifePostIcons,
  sortOptions,
  filters,
  form,
  registrationFilters,
  registrationPage,
  registrationPageCount,
  registrationTotal,
  registrationErrorMessage,
  registrationEditDialog,
  registrationCreateDialog,
  checkInCodeDialog,
  postsQuery,
  registrationsQuery,
  createMutation,
  updateMutation,
  publishMutation,
  submitReviewMutation,
  returnDraftMutation,
  archiveMutation,
  unpublishMutation,
  deleteMutation,
  exportRegistrationsMutation,
  createRegistrationMutation,
  createCheckInCodeMutation,
  updateRegistrationStatusMutation,
  updateRegistrationMutation,
  posts,
  registrations,
  canSave,
  publicPostCount,
  privatePostCount,
  previewPost,
  imagePreviewUrl,
  uploadImageMutation,
  imageUploadErrorMessage,
  lifePostMutationErrorMessage,
  showToast,
  lifePostAiInput,
  notificationAiInput,
  lifePostAiResource,
  publishReadinessChecks,
  isPublishReady,
  isScheduleValid,
  isCtaUrlValid,
  openPost,
  newPost,
  saveLifePost,
  submitCurrentLifePostReview,
  returnLifePostToDraft,
  publishCurrentLifePost,
  unpublishCurrentLifePost,
  openRegistrationEditor,
  openRegistrationCreator,
  applyRegistrationFilters,
  setRegistrationPage,
  closeCheckInCodeDialog,
  statusColor,
  visibilityColor,
  iconLabel,
  formatSchedule,
  formatDateTime,
  uploadSelectedImage,
  clearImage,
  applyLifePostAiDraft,
  applyNotificationAiDraft,
  requestArchive,
  requestDelete,
  confirmPendingAction
} = useLifePostsPageController();
const deepLink = useAdminResourceDeepLink(getLifePost, openPost);
</script>

<template>
  <div>
    <v-progress-linear v-if="deepLink.pending.value" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="deepLink.error.value" type="error" variant="tonal" class="mb-4">
      {{ t("nav.openResourceFailed") }}
    </v-alert>
    <AdminPageHeader :title="t('nav.lifePosts')" :subtitle="t('life.pageSubtitle')">
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="postsQuery.isFetching.value"
          @click="postsQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn
          v-if="authStore.can('life_posts:update')"
          color="primary"
          prepend-icon="mdi-plus"
          @click="newPost"
        >
          {{ t("New post") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <LifePostLibraryCard
      :filters="filters"
      :posts="posts"
      :pending="postsQuery.isPending.value"
      :fetching="postsQuery.isFetching.value"
      :error="postsQuery.error.value"
      :public-post-count="publicPostCount"
      :private-post-count="privatePostCount"
      :status-color="statusColor"
      :visibility-color="visibilityColor"
      :format-schedule="formatSchedule"
      :format-date-time="formatDateTime"
      @refetch="postsQuery.refetch()"
      @open="openPost"
    />

    <AdminResponsiveDrawer v-model="drawer" :desktop-width="520">
      <div class="pa-5">
        <div class="text-h6 font-weight-bold">
          {{ selectedPost ? selectedPost.title : t("New life post") }}
        </div>
        <LifePostPreviewCard
          v-if="previewPost"
          :post="previewPost"
          :icon-label="iconLabel"
          :status-color="statusColor"
          :visibility-color="visibilityColor"
          :format-schedule="formatSchedule"
        />
        <LifeEventRegistrationsCard
          v-if="
            selectedPost?.registrationEnabled &&
            authStore.can('life_posts:update')
          "
          :post="selectedPost"
          :filters="registrationFilters"
          :registrations="registrations"
          :page="registrationPage"
          :page-count="registrationPageCount"
          :total="registrationTotal"
          :pending="registrationsQuery.isPending.value"
          :fetching="registrationsQuery.isFetching.value"
          :error-message="registrationErrorMessage"
          :edit-dialog="registrationEditDialog"
          :create-dialog="registrationCreateDialog"
          :check-in-code-dialog="checkInCodeDialog"
          :export-loading="exportRegistrationsMutation.isPending.value"
          :update-status-loading="updateRegistrationStatusMutation.isPending.value"
          :update-loading="updateRegistrationMutation.isPending.value"
          :create-loading="createRegistrationMutation.isPending.value"
          :check-in-code-loading="createCheckInCodeMutation.isPending.value"
          :format-date-time="formatDateTime"
          @add-registration="openRegistrationCreator"
          @create-check-in-code="createCheckInCodeMutation.mutate({ rotate: false })"
          @rotate-check-in-code="createCheckInCodeMutation.mutate({ rotate: true })"
          @export-csv="exportRegistrationsMutation.mutate()"
          @apply-filters="applyRegistrationFilters"
          @retry="registrationsQuery.refetch()"
          @update-page="setRegistrationPage"
          @edit-registration="openRegistrationEditor"
          @update-status="updateRegistrationStatusMutation.mutate"
          @close-edit="registrationEditDialog.show = false"
          @save-edit="updateRegistrationMutation.mutate()"
          @close-create="registrationCreateDialog.show = false"
          @save-create="createRegistrationMutation.mutate()"
          @close-check-in-code="closeCheckInCodeDialog"
        />
        <v-form
          class="mt-5"
          @submit.prevent="saveLifePost"
        >
          <template v-if="authStore.can('life_posts:update')">
            <LifePostDetailsFields
              v-model="form"
              :life-post-types="lifePostTypes"
              :life-post-icons="lifePostIcons"
              :sort-options="sortOptions"
              :image-preview-url="imagePreviewUrl"
              :image-upload-pending="uploadImageMutation.isPending.value"
              :image-upload-error-message="imageUploadErrorMessage"
              :schedule-valid="isScheduleValid"
              :cta-url-valid="isCtaUrlValid"
              @upload-image="uploadSelectedImage"
              @clear-image="clearImage"
            />
            <AdminAiDraftPanel
              task="life_post_draft"
              :title="t('ai.lifePostTitle')"
              :subtitle="t('ai.lifePostSubtitle')"
              :button-label="t('ai.generateLifePost')"
              :apply-label="t('ai.applyToBody')"
              :input="lifePostAiInput"
              :resource="lifePostAiResource"
              :can-use="authStore.can('ai:use')"
              :disabled="!form.title.trim() && !form.body.trim() && !form.meta.trim()"
              @apply="applyLifePostAiDraft"
            />
          </template>

          <LifePostPublishChecklist :ready="isPublishReady" :checks="publishReadinessChecks" />

          <LifePostNotificationPanel
            v-model:form="form"
            v-model:locale="notificationLocale"
            :post="selectedPost"
            :locale-options="notificationLocaleOptions"
            :translating-locale="translatingNotificationLocale"
            :ai-input="notificationAiInput"
            :ai-resource="lifePostAiResource"
            :can-use-ai="authStore.can('ai:use')"
            @translate="translateNotificationTarget"
            @apply-ai="applyNotificationAiDraft"
          />

          <ContentLocalizationCard
            v-if="selectedPost"
            resource-type="life_post"
            :resource-id="selectedPost.id"
            :revision="selectedPost.revision"
            :fields="{ title: form.title, body: form.body, meta: form.meta, ...(form.ctaLabel ? { ctaLabel: form.ctaLabel } : {}) }"
            :can-edit="authStore.can('life_posts:update')"
            :can-use-ai="authStore.can('ai:use')"
            :source-locale="form.sourceLocale"
            @update:source-locale="form.sourceLocale = $event"
          />
          <LifePostEditorActions
            :post="selectedPost"
            :error-message="lifePostMutationErrorMessage"
            :publish-ready="isPublishReady"
            :can-save="canSave"
            :can-update="authStore.can('life_posts:update')"
            :can-publish="authStore.can('life_posts:publish')"
            :submit-review-loading="submitReviewMutation.isPending.value"
            :return-draft-loading="returnDraftMutation.isPending.value"
            :publish-loading="publishMutation.isPending.value"
            :unpublish-loading="unpublishMutation.isPending.value"
            :archive-loading="archiveMutation.isPending.value"
            :delete-loading="deleteMutation.isPending.value"
            :save-loading="
              createMutation.isPending.value || updateMutation.isPending.value
            "
            @submit-review="submitCurrentLifePostReview"
            @return-draft="returnLifePostToDraft"
            @publish="publishCurrentLifePost"
            @unpublish="unpublishCurrentLifePost"
            @archive="requestArchive"
            @delete="requestDelete"
          />
        </v-form>
      </div>
    </AdminResponsiveDrawer>

    <LifePostConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :color="confirmDialog.color"
      :confirm-label="confirmDialog.confirmLabel"
      @confirm="confirmPendingAction"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
