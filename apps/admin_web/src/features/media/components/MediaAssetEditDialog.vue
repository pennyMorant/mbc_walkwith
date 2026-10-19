<script setup lang="ts">
import type {
  MediaAsset,
  MediaAssetUsage,
  MediaAssetUpdateRequest,
  MediaConsentStatus
} from "@mbc/api-contracts";
import { reactive, watch } from "vue";

import { useI18n } from "@/core/i18n/i18n";

const props = defineProps<{
  modelValue: boolean;
  asset: MediaAsset | null;
  saving: boolean;
  error: string;
  usages: MediaAssetUsage[];
  usagesLoading: boolean;
  usagesError: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [input: MediaAssetUpdateRequest];
}>();
const { optionItems, t } = useI18n();
const consentStatuses: MediaConsentStatus[] = [
  "pending",
  "approved",
  "restricted"
];
const form = reactive({
  consentStatus: "pending" as MediaConsentStatus,
  altText: "",
  caption: "",
  copyrightSource: "",
  focalX: 50,
  focalY: 50
});

watch(
  [() => props.asset, () => props.modelValue],
  ([asset, open]) => {
    if (!asset || !open) return;
    form.consentStatus = asset.consentStatus;
    form.altText = asset.altText;
    form.caption = asset.caption;
    form.copyrightSource = asset.copyrightSource ?? "";
    form.focalX = asset.focalX;
    form.focalY = asset.focalY;
  },
  { immediate: true }
);

function close() {
  if (!props.saving) emit("update:modelValue", false);
}

function save() {
  emit("save", {
    consentStatus: form.consentStatus,
    altText: form.altText,
    caption: form.caption,
    copyrightSource: form.copyrightSource.trim() || null,
    focalX: form.focalX,
    focalY: form.focalY
  });
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    :persistent="saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card v-if="asset">
      <v-card-title>{{ t("media.editTitle") }}</v-card-title>
      <v-card-subtitle>{{ asset.originalFileName }}</v-card-subtitle>
      <v-card-text class="media-form">
        <div class="media-preview">
          <v-img
            v-if="asset.url"
            :src="asset.url"
            :alt="asset.altText"
            aspect-ratio="1.8"
            cover
          />
          <v-icon v-else icon="mdi-image-lock-outline" size="48" />
        </div>
        <v-alert v-if="error" type="error" variant="tonal">
          {{ error }}
        </v-alert>
        <v-select
          v-model="form.consentStatus"
          :items="optionItems(consentStatuses)"
          :label="t('media.consentStatus')"
          variant="filled"
        />
        <v-text-field
          v-model="form.altText"
          :label="t('media.altText')"
          variant="filled"
          maxlength="500"
          counter
        />
        <v-textarea
          v-model="form.caption"
          :label="t('media.caption')"
          variant="filled"
          maxlength="2000"
          counter
          rows="3"
          auto-grow
        />
        <v-text-field
          v-model="form.copyrightSource"
          :label="t('media.copyrightSource')"
          variant="filled"
          maxlength="500"
        />
        <div>
          <div class="text-body-2 mb-1">
            {{ t("media.focalX") }}: {{ form.focalX }}%
          </div>
          <v-slider v-model="form.focalX" :min="0" :max="100" :step="1" />
        </div>
        <div>
          <div class="text-body-2 mb-1">
            {{ t("media.focalY") }}: {{ form.focalY }}%
          </div>
          <v-slider v-model="form.focalY" :min="0" :max="100" :step="1" />
        </div>
        <v-divider class="my-2" />
        <div class="d-flex align-center justify-space-between ga-3">
          <div>
            <div class="text-subtitle-2 font-weight-bold">
              {{ t("media.usagesTitle") }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ t("media.usagesSubtitle") }}
            </div>
          </div>
          <v-chip size="small" variant="tonal">{{ usages.length }}</v-chip>
        </div>
        <v-progress-linear v-if="usagesLoading" indeterminate color="primary" />
        <v-alert v-else-if="usagesError" type="error" variant="tonal">
          {{ usagesError }}
        </v-alert>
        <v-alert v-else-if="usages.length === 0" type="info" variant="tonal">
          {{ t("media.usagesEmpty") }}
        </v-alert>
        <v-list v-else density="compact" class="usage-list">
          <v-list-item
            v-for="usage in usages"
            :key="`${usage.source}:${usage.sourceId}:${usage.slot}`"
            :title="usage.sourceLabel"
            :subtitle="`${t(usage.source)} · ${t(usage.slot)}`"
          />
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">
          {{ t("Cancel") }}
        </v-btn>
        <v-btn color="primary" :loading="saving" @click="save">
          {{ t("Save") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.media-form {
  display: grid;
  gap: 8px;
}

.media-preview {
  min-height: 180px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.usage-list {
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}
</style>
