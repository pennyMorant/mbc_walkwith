<script setup lang="ts">
import type {
  AdminAiTask,
  AiDraftResponse,
  AiResourceReference,
  AiTaskInput
} from "@mbc/api-contracts";
import { toRefs } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import { useAdminAiDraftPanel } from "../composables/use_admin_ai_draft_panel";

const props = withDefaults(
  defineProps<{
    task: AdminAiTask;
    title: string;
    subtitle: string;
    buttonLabel: string;
    applyLabel: string;
    input: AiTaskInput;
    resource?: AiResourceReference;
    canUse?: boolean;
    disabled?: boolean;
  }>(),
  {
    canUse: true,
    disabled: false
  }
);

const emit = defineEmits<{
  apply: [markdown: string, response: AiDraftResponse];
}>();

const { locale, t } = useI18n();
const { task, input: taskInput, resource, canUse, disabled } = toRefs(props);
const {
  applyDraft,
  canGenerate,
  discardDraft,
  draftApplied,
  draftMarkdown,
  errorMessage,
  generateDraft,
  hasInput,
  isGenerating,
  latestResponse,
  providerLabel,
  status,
  statusQuery,
  taskSupported
} = useAdminAiDraftPanel({
  task,
  taskInput,
  resource,
  canUse,
  disabled,
  locale,
  t,
  onApply: (markdown, response) => emit("apply", markdown, response)
});
</script>

<template>
  <v-sheet class="ai-draft-panel mb-4" rounded border>
    <div class="pa-4">
      <div class="d-flex flex-column flex-sm-row justify-space-between ga-3">
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ title }}</div>
          <div class="text-caption text-medium-emphasis">{{ subtitle }}</div>
        </div>
        <v-chip
          size="small"
          variant="tonal"
          :color="status?.enabled ? 'primary' : 'warning'"
        >
          {{ providerLabel }}
        </v-chip>
      </div>

      <v-alert
        v-if="!canUse"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ t("ai.permissionRequired") }}
      </v-alert>
      <v-alert
        v-else-if="status && !status.enabled"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ t("ai.providerDisabled") }}
      </v-alert>
      <v-alert
        v-else-if="status?.enabled && !taskSupported"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ t("ai.taskUnsupported") }}
      </v-alert>
      <v-alert
        v-else-if="status?.enabled && taskSupported && !hasInput"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ t("ai.inputRequired") }}
      </v-alert>
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ errorMessage }}
      </v-alert>
      <v-alert
        v-if="draftApplied"
        type="success"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ t("ai.draftApplied") }}
      </v-alert>

      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-auto-fix"
          :loading="isGenerating"
          :disabled="!canGenerate"
          @click="generateDraft"
        >
          {{ buttonLabel }}
        </v-btn>
        <v-btn
          v-if="draftMarkdown"
          color="success"
          variant="tonal"
          :disabled="!draftMarkdown.trim()"
          @click="applyDraft"
        >
          {{ applyLabel }}
        </v-btn>
        <v-btn
          v-if="draftMarkdown"
          variant="text"
          prepend-icon="mdi-close"
          @click="discardDraft"
        >
          {{ t("ai.discardDraft") }}
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-if="draftMarkdown" class="mt-4">
          <v-textarea
            v-model="draftMarkdown"
            :label="t('ai.generatedDraft')"
            rows="8"
            density="comfortable"
            variant="outlined"
            hide-details
          />
          <div class="text-caption text-medium-emphasis mt-2">
            {{
              latestResponse?.safetyNotice ||
              t("ai.safetyNotice")
            }}
          </div>
        </div>
      </v-expand-transition>
    </div>
  </v-sheet>
</template>

<style scoped>
.ai-draft-panel {
  background: rgb(var(--v-theme-surface));
}
</style>
