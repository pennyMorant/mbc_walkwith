<script setup lang="ts">
import type {
  AiDraftResponse,
  AiResourceReference,
  AiTaskInput,
  ContentLocale,
  LifePost
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminAiDraftPanel from "../../ai/components/AdminAiDraftPanel.vue";
import type { LifePostEditorForm } from "../life_post_editor_models";

const form = defineModel<LifePostEditorForm>("form", { required: true });
const locale = defineModel<ContentLocale>("locale", { required: true });
defineProps<{
  post: LifePost | null;
  localeOptions: Array<{ title: string; value: ContentLocale }>;
  translatingLocale: ContentLocale | null;
  aiInput: AiTaskInput;
  aiResource?: AiResourceReference;
  canUseAi: boolean;
}>();
defineEmits<{
  translate: [locale: ContentLocale];
  applyAi: [markdown: string, response: AiDraftResponse];
}>();

const { t } = useI18n();
</script>

<template>
  <v-sheet v-if="post && post.status !== 'published'" class="mb-4" rounded border>
    <div class="pa-4">
      <div class="d-flex align-center justify-space-between ga-4">
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ t("App notification") }}</div>
          <div class="text-caption text-medium-emphasis">{{ t("Notify app members when publishing") }}</div>
        </div>
        <v-switch v-model="form.notifyAppOnPublish" color="primary" density="compact" hide-details inset />
      </div>
      <v-expand-transition>
        <div v-if="form.notifyAppOnPublish" class="mt-4">
          <v-tabs v-model="locale" density="compact" grow>
            <v-tab v-for="item in localeOptions" :key="item.value" :value="item.value">
              {{ item.title }}
            </v-tab>
          </v-tabs>
          <v-window v-model="locale" class="mt-3">
            <v-window-item :value="form.sourceLocale">
              <v-text-field v-model="form.notificationTitle" :label="t('Notification title')" :placeholder="form.title || t('Leave blank to use post title')" maxlength="120" counter variant="outlined" />
              <v-textarea v-model="form.notificationBody" :label="t('Notification body')" :placeholder="t('Leave blank to use post body')" maxlength="180" counter rows="3" variant="outlined" hide-details />
              <AdminAiDraftPanel
                v-bind="aiResource ? { resource: aiResource } : {}"
                task="notification_draft"
                :title="t('ai.notificationTitle')"
                :subtitle="t('ai.notificationSubtitle')"
                :button-label="t('ai.generateNotification')"
                :apply-label="t('ai.applyToNotification')"
                :input="aiInput"
                :can-use="canUseAi"
                :disabled="!form.title.trim() && !form.body.trim()"
                @apply="(markdown, response) => $emit('applyAi', markdown, response)"
              />
            </v-window-item>
            <v-window-item
              v-for="item in localeOptions.filter((option) => option.value !== form.sourceLocale)"
              :key="item.value"
              :value="item.value"
            >
              <div class="d-flex justify-end mb-2">
                <v-btn size="small" variant="tonal" color="primary" :loading="translatingLocale === item.value" :disabled="!canUseAi" @click="$emit('translate', item.value)">
                  {{ t("localization.generate") }}
                </v-btn>
              </div>
              <v-text-field v-model="form.notificationTranslations[item.value].title" :label="t('Notification title')" :placeholder="t('Leave blank to use source notification')" maxlength="120" counter variant="outlined" />
              <v-textarea v-model="form.notificationTranslations[item.value].body" :label="t('Notification body')" :placeholder="t('Leave blank to use source notification')" maxlength="180" counter rows="3" variant="outlined" hide-details />
            </v-window-item>
          </v-window>
        </div>
      </v-expand-transition>
    </div>
  </v-sheet>
</template>
