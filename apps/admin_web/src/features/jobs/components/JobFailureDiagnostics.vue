<script setup lang="ts">
import {
  jobResultErrorSchema,
  jobResultLifecycleSchema,
  type Job
} from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";

const props = withDefaults(defineProps<{
  job: Job;
  compact?: boolean;
}>(), {
  compact: false
});

const { t } = useI18n();

const resultRecord = computed(() => recordFromUnknown(props.job.result));

const lifecycle = computed(() => {
  const parsed = jobResultLifecycleSchema.safeParse(
    resultRecord.value?.lifecycle
  );
  return parsed.success ? parsed.data : null;
});

const error = computed(() => {
  const parsed = jobResultErrorSchema.safeParse(resultRecord.value?.error);
  return parsed.success ? parsed.data : null;
});

const phase = computed(() => stringFromUnknown(resultRecord.value?.phase));
const suggestedAction = computed(() =>
  stringFromUnknown(resultRecord.value?.suggestedAction)
);

const shouldShow = computed(
  () =>
    props.job.status === "failed" ||
    Boolean(props.job.errorMessage || lifecycle.value || error.value)
);

const statusColor = computed(() => {
  if (lifecycle.value?.state === "failed_recoverable") {
    return "warning";
  }
  if (lifecycle.value?.state === "failed_terminal") {
    return "error";
  }
  return "default";
});

const retryableLabel = computed(() =>
  labelFromBoolean(error.value?.retryable ?? lifecycle.value?.retryable)
);

const recoverableLabel = computed(() =>
  labelFromBoolean(error.value?.recoverable)
);

function labelFromBoolean(value: boolean | undefined) {
  if (value === undefined) {
    return t("common.notSet");
  }
  return value ? t("common.yes") : t("common.no");
}

function recordFromUnknown(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function stringFromUnknown(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
</script>

<template>
  <v-alert
    v-if="shouldShow"
    type="error"
    variant="tonal"
    :class="props.compact ? 'mt-3' : 'mt-5'"
    :density="props.compact ? 'compact' : 'default'"
  >
    <div class="d-flex align-center justify-space-between ga-3">
      <div>
        <div class="text-subtitle-2 font-weight-bold">
          {{ t("jobs.failureDiagnostics") }}
        </div>
        <div v-if="props.job.errorMessage" class="text-body-2 mt-1">
          {{ props.job.errorMessage }}
        </div>
      </div>
      <v-chip v-if="lifecycle" :color="statusColor" size="small">
        {{ t(lifecycle.state) }}
      </v-chip>
    </div>

    <v-row v-if="error || lifecycle || phase" class="mt-3" dense>
      <v-col v-if="error" cols="12" sm="6">
        <div class="diagnostic-label">{{ t("Code") }}</div>
        <div class="diagnostic-value">{{ error.code }}</div>
      </v-col>
      <v-col v-if="error" cols="12" sm="6">
        <div class="diagnostic-label">{{ t("Category") }}</div>
        <div class="diagnostic-value">{{ error.category }}</div>
      </v-col>
      <v-col v-if="phase" cols="12" sm="6">
        <div class="diagnostic-label">{{ t("Phase") }}</div>
        <div class="diagnostic-value">{{ phase }}</div>
      </v-col>
      <v-col v-if="error?.sourceLayer" cols="12" sm="6">
        <div class="diagnostic-label">{{ t("Owner layer") }}</div>
        <div class="diagnostic-value">{{ error.sourceLayer }}</div>
      </v-col>
      <v-col cols="12" sm="6">
        <div class="diagnostic-label">{{ t("Retryable") }}</div>
        <div class="diagnostic-value">{{ retryableLabel }}</div>
      </v-col>
      <v-col cols="12" sm="6">
        <div class="diagnostic-label">{{ t("Recoverable") }}</div>
        <div class="diagnostic-value">{{ recoverableLabel }}</div>
      </v-col>
      <v-col v-if="error?.nextAction || lifecycle?.nextAction" cols="12">
        <div class="diagnostic-label">{{ t("Next action") }}</div>
        <div class="diagnostic-value">
          {{ error?.nextAction || lifecycle?.nextAction }}
        </div>
      </v-col>
    </v-row>

    <div v-if="suggestedAction" class="mt-4">
      <div class="diagnostic-label">{{ t("Suggested action") }}</div>
      <div class="text-body-2">{{ suggestedAction }}</div>
    </div>

    <v-expansion-panels
      v-if="error && !props.compact"
      class="mt-4"
      variant="accordion"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ t("jobs.diagnosticsEvidence") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <pre class="diagnostic-json">{{ formatJson(error.evidence) }}</pre>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ t("jobs.diagnosticsDetails") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <pre class="diagnostic-json">{{ formatJson(error.details) }}</pre>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-alert>
</template>

<style scoped>
.diagnostic-label {
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 12px;
}

.diagnostic-value {
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.diagnostic-json {
  margin: 0;
  overflow: auto;
  font-size: 12px;
}
</style>
