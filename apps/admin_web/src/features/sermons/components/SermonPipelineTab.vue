<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";
import type {
  SermonPipelineAction,
  SermonPipelineStep
} from "../sermon_pipeline";

defineProps<{
  steps: SermonPipelineStep[];
  progress: number;
  nextStep: SermonPipelineStep | null;
  workflowRefreshing: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  action: [action: SermonPipelineAction];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <v-card variant="outlined" class="pa-4 mb-4">
      <AdminPanelHeader
        :title="t('Sermon pipeline')"
        :subtitle="
          nextStep
            ? `${t('sermons.pipelineNext')}: ${nextStep.title}`
            : t('sermons.pipelineComplete')
        "
      >
        <template #actions>
          <div class="d-flex align-center ga-2">
            <v-chip color="info" size="small" variant="tonal">
              {{ progress }}%
            </v-chip>
            <v-btn
              size="small"
              variant="tonal"
              :loading="workflowRefreshing"
              @click="emit('refresh')"
            >
              {{ t("common.refresh") }}
            </v-btn>
          </div>
        </template>
      </AdminPanelHeader>

      <v-progress-linear
        class="mt-4"
        color="primary"
        height="8"
        rounded
        :model-value="progress"
      />

      <v-alert type="info" variant="tonal" class="mt-4">
        {{
          t(
            "Sermon transcript, outline, and Scripture references are prepared locally and edited here before review."
          )
        }}
      </v-alert>
    </v-card>

    <v-card
      v-for="step in steps"
      :key="step.id"
      variant="outlined"
      class="pa-4 mb-3 pipeline-step"
    >
      <div class="d-flex align-start justify-space-between ga-4">
        <div class="d-flex align-start ga-3">
          <v-icon class="mt-1" :color="step.color" :icon="step.icon" />
          <div>
            <div class="d-flex align-center ga-2 flex-wrap">
              <div class="text-subtitle-2 font-weight-bold">
                {{ step.title }}
              </div>
              <v-chip size="x-small" :color="step.color" variant="tonal">
                {{ step.stateLabel }}
              </v-chip>
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ step.subtitle }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ step.detail }}
            </div>
          </div>
        </div>

        <div v-if="step.action" class="pipeline-step__action">
          <v-btn
            size="small"
            :color="step.action.color"
            variant="tonal"
            :loading="step.action.loading"
            :disabled="step.action.disabled"
            @click="emit('action', step.action)"
          >
            {{ step.action.label }}
          </v-btn>
          <div
            v-if="step.action.disabled && step.action.disabledReason"
            class="text-caption text-medium-emphasis mt-1"
          >
            {{ step.action.disabledReason }}
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.pipeline-step {
  transition: border-color 0.15s ease;
}

.pipeline-step__action {
  min-width: 150px;
  text-align: right;
}

@media (max-width: 640px) {
  .pipeline-step__action {
    min-width: 0;
    text-align: left;
  }
}
</style>
