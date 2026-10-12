<script setup lang="ts">
import type { ContentLocale } from "@mbc/api-contracts";
import { ref } from "vue";
import { translateLifePostNotification } from "@/core/api/life_posts";
import { formatApiErrorMessage } from "@/core/api/api_errors";

import AdminAiDraftPanel from "../../ai/components/AdminAiDraftPanel.vue";
import ContentLocalizationCard from "../../content-localization/components/ContentLocalizationCard.vue";
import LifeEventRegistrationSettings from "../components/LifeEventRegistrationSettings.vue";
import LifeEventRegistrationsCard from "../components/LifeEventRegistrationsCard.vue";
import LifePostConfirmDialog from "../components/LifePostConfirmDialog.vue";
import LifePostMarkdownEditor from "../components/LifePostMarkdownEditor.vue";
import LifePostEditorActions from "../components/LifePostEditorActions.vue";
import LifePostLibraryCard from "../components/LifePostLibraryCard.vue";
import LifePostPreviewCard from "../components/LifePostPreviewCard.vue";
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
  displayWeightOptions,
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
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("nav.lifePosts") }}</div>
        <div class="page-subtitle">
          {{ t("life.pageSubtitle") }}
        </div>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          color="primary"
          variant="tonal"
          :loading="postsQuery.isFetching.value"
          @click="postsQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn
          v-if="authStore.can('life_posts:update')"
          color="primary"
          @click="newPost"
        >
          {{ t("New post") }}
        </v-btn>
      </div>
    </div>

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

    <v-navigation-drawer v-model="drawer" location="right" temporary width="520">
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
          <v-row dense>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="form.type"
                :label="t('Type')"
                :items="optionItems(lifePostTypes)"
                item-title="title"
                item-value="value"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.visibility"
                :label="t('Visibility')"
                :items="optionItems(['public', 'members', 'group', 'private'])"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                :label="t('Status')"
                :items="optionItems(['draft', 'needs_review', 'published', 'archived'])"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.displayWeight"
                :label="t('life.displayWeight.label')"
                :items="displayWeightOptions"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model="form.title"
            :label="t('Title')"
            density="comfortable"
            variant="outlined"
          />
          <v-text-field
            v-model="form.meta"
            :label="t('Meta')"
            density="comfortable"
            variant="outlined"
          />
          <v-row dense>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="form.ctaLabel"
                :label="t('Action label')"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="7">
              <v-text-field
                v-model="form.ctaUrl"
                :label="t('Action URL')"
                density="comfortable"
                variant="outlined"
                :placeholder="t('life.actionUrlPlaceholder')"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.startsAt"
                :label="t('Starts at')"
                type="datetime-local"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.endsAt"
                :label="t('Ends at')"
                type="datetime-local"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model="form.imageUrl"
            :label="t('Image URL')"
            density="comfortable"
            variant="outlined"
          />
          <v-file-input
            :label="t('Upload image')"
            accept="image/png,image/jpeg,image/webp,image/gif"
            density="comfortable"
            variant="outlined"
            prepend-icon=""
            prepend-inner-icon="mdi-image-plus"
            :loading="uploadImageMutation.isPending.value"
            @update:model-value="uploadSelectedImage"
          />
          <v-alert
            v-if="imageUploadErrorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ imageUploadErrorMessage }}
          </v-alert>
          <v-img
            v-if="imagePreviewUrl"
            :src="imagePreviewUrl"
            height="160"
            cover
            class="life-post-image-preview mb-3"
          />
          <div class="d-flex justify-end mb-5">
            <v-btn
              v-if="imagePreviewUrl"
              color="secondary"
              variant="tonal"
              size="small"
              @click="clearImage"
            >
              {{ t("Clear image") }}
            </v-btn>
          </div>
          <v-select
            v-model="form.iconName"
            :label="t('Icon name')"
            :items="optionItems(lifePostIcons)"
            density="comfortable"
            variant="outlined"
          />
          <LifePostMarkdownEditor v-model="form.body" :label="t('Body')" :rows="8" />

          <AdminAiDraftPanel
            task="life_post_draft"
            :title="t('ai.lifePostTitle')"
            :subtitle="t('ai.lifePostSubtitle')"
            :button-label="t('ai.generateLifePost')"
            :apply-label="t('ai.applyToBody')"
            :input="lifePostAiInput"
            :resource="lifePostAiResource"
            :can-use="authStore.can('ai:use')"
            :disabled="
              !form.title.trim() && !form.body.trim() && !form.meta.trim()
            "
            @apply="applyLifePostAiDraft"
          />

          <LifeEventRegistrationSettings
            :form="form"
            @update-form="Object.assign(form, $event)"
          />

          <v-alert
            v-if="!isScheduleValid || !isCtaUrlValid"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            {{
              !isScheduleValid
                ? t("End time must be after start time.")
                : t("Action URL must start with http or https.")
              }}
          </v-alert>
          </template>

          <v-sheet class="life-publish-checklist mb-4" rounded border>
            <div class="pa-4">
              <div class="d-flex align-center justify-space-between ga-3">
                <div>
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ t("Publish checklist") }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ t("Review required fields before sending content to the app.") }}
                  </div>
                </div>
                <v-chip
                  :color="isPublishReady ? 'success' : 'warning'"
                  size="small"
                  variant="tonal"
                >
                  {{ isPublishReady ? t("Ready to publish") : t("Incomplete") }}
                </v-chip>
              </div>
              <v-list density="compact" class="mt-2 pa-0">
                <v-list-item
                  v-for="check in publishReadinessChecks"
                  :key="check.label"
                  class="px-0"
                >
                  <template #prepend>
                    <v-icon
                      :color="check.ok ? 'success' : 'warning'"
                      :icon="check.ok ? 'mdi-check-circle' : 'mdi-alert-circle'"
                    />
                  </template>
                  <v-list-item-title>{{ check.label }}</v-list-item-title>
                  <v-list-item-subtitle>{{ check.detail }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>
          </v-sheet>

          <v-sheet
            v-if="selectedPost && selectedPost.status !== 'published'"
            class="life-publish-notification mb-4"
            rounded
            border
          >
            <div class="pa-4">
              <div class="d-flex align-center justify-space-between ga-4">
                <div>
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ t("App notification") }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ t("Notify app members when publishing") }}
                  </div>
                </div>
                <v-switch
                  v-model="form.notifyAppOnPublish"
                  color="primary"
                  density="compact"
                  hide-details
                  inset
                />
              </div>
              <v-expand-transition>
                <div v-if="form.notifyAppOnPublish" class="mt-4">
                  <v-tabs v-model="notificationLocale" density="compact" grow>
                    <v-tab
                      v-for="item in notificationLocaleOptions"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.title }}
                    </v-tab>
                  </v-tabs>
                  <v-window v-model="notificationLocale" class="mt-3">
                    <v-window-item :value="form.sourceLocale">
                      <v-text-field
                        v-model="form.notificationTitle"
                        :label="t('Notification title')"
                        :placeholder="form.title || t('Leave blank to use post title')"
                        maxlength="120"
                        counter
                        density="comfortable"
                        variant="outlined"
                      />
                      <v-textarea
                        v-model="form.notificationBody"
                        :label="t('Notification body')"
                        :placeholder="t('Leave blank to use post body')"
                        maxlength="180"
                        counter
                        rows="3"
                        density="comfortable"
                        variant="outlined"
                        hide-details
                      />
                      <AdminAiDraftPanel
                        task="notification_draft"
                        :title="t('ai.notificationTitle')"
                        :subtitle="t('ai.notificationSubtitle')"
                        :button-label="t('ai.generateNotification')"
                        :apply-label="t('ai.applyToNotification')"
                        :input="notificationAiInput"
                        :resource="lifePostAiResource"
                        :can-use="authStore.can('ai:use')"
                        :disabled="!form.title.trim() && !form.body.trim()"
                        @apply="applyNotificationAiDraft"
                      />
                    </v-window-item>
                    <v-window-item
                      v-for="item in notificationLocaleOptions.filter(
                        (option) => option.value !== form.sourceLocale
                      )"
                      :key="item.value"
                      :value="item.value"
                    >
                      <div class="d-flex justify-end mb-2">
                        <v-btn
                          size="small"
                          variant="tonal"
                          color="primary"
                          :loading="translatingNotificationLocale === item.value"
                          :disabled="!authStore.can('ai:use')"
                          @click="translateNotificationTarget(item.value)"
                        >
                          {{ t("localization.generate") }}
                        </v-btn>
                      </div>
                      <v-text-field
                        v-model="form.notificationTranslations[item.value].title"
                        :label="t('Notification title')"
                        :placeholder="t('Leave blank to use source notification')"
                        maxlength="120"
                        counter
                        density="comfortable"
                        variant="outlined"
                      />
                      <v-textarea
                        v-model="form.notificationTranslations[item.value].body"
                        :label="t('Notification body')"
                        :placeholder="t('Leave blank to use source notification')"
                        maxlength="180"
                        counter
                        rows="3"
                        density="comfortable"
                        variant="outlined"
                        hide-details
                      />
                    </v-window-item>
                  </v-window>
                </div>
              </v-expand-transition>
            </div>
          </v-sheet>

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
    </v-navigation-drawer>

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

<style scoped>
.life-post-image-preview {
  border-radius: 8px;
}

.life-publish-checklist {
  background: rgb(var(--v-theme-surface));
}
</style>
