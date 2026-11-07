<script setup lang="ts">
import type { MediaAsset } from "@mbc/api-contracts";
import { computed, onMounted, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { listMediaImages, uploadMediaImage } from "@/core/api/media";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminDialogHeader from "@/core/ui/AdminDialogHeader.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    altText?: string;
  }>(),
  { altText: "" }
);
const emit = defineEmits<{
  "update:modelValue": [value: string | null];
}>();
const { t } = useI18n();
const input = ref<HTMLInputElement | null>(null);
const dialog = ref(false);
const libraryLoading = ref(false);
const uploadLoading = ref(false);
const assets = ref<MediaAsset[]>([]);
const libraryError = ref("");
const uploadError = ref("");
const previewUrl = computed(
  () => assets.value.find((asset) => asset.id === props.modelValue)?.url ?? ""
);

onMounted(loadAssets);

async function loadAssets() {
  libraryLoading.value = true;
  libraryError.value = "";
  try {
    assets.value = await listMediaImages();
  } catch (cause) {
    libraryError.value = formatApiErrorMessage(cause, t("common.error"));
  } finally {
    libraryLoading.value = false;
  }
}

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploadLoading.value = true;
  uploadError.value = "";
  try {
    const asset = await uploadMediaImage(file, props.altText);
    assets.value = [asset, ...assets.value.filter((item) => item.id !== asset.id)];
    select(asset);
  } catch (cause) {
    uploadError.value = formatApiErrorMessage(cause, t("common.error"));
  } finally {
    uploadLoading.value = false;
    if (input.value) input.value.value = "";
  }
}

function select(asset: MediaAsset) {
  emit("update:modelValue", asset.id);
  dialog.value = false;
}
</script>

<template>
  <div class="media-picker">
    <div class="media-preview">
      <v-img v-if="previewUrl" :src="previewUrl" cover />
      <v-icon v-else icon="mdi-image-outline" size="36" />
    </div>
    <div class="media-actions">
      <input
        ref="input"
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        @change="onFileChange"
      />
      <v-btn
        prepend-icon="mdi-cloud-upload-outline"
        color="primary"
        variant="tonal"
        :loading="uploadLoading"
        @click="input?.click()"
      >
        {{ t("settings.landing.uploadImage") }}
      </v-btn>
      <v-btn
        prepend-icon="mdi-image-multiple-outline"
        variant="text"
        @click="dialog = true"
      >
        {{ t("settings.landing.chooseImage") }}
      </v-btn>
      <v-btn
        v-if="modelValue"
        icon="mdi-close"
        variant="text"
        :aria-label="t('settings.landing.removeImage')"
        @click="emit('update:modelValue', null)"
      />
    </div>
    <v-alert
      v-if="uploadError"
      type="error"
      variant="tonal"
      density="compact"
    >
      {{ uploadError }}
    </v-alert>
  </div>

  <v-dialog v-model="dialog" max-width="920">
    <v-card>
      <AdminDialogHeader
        :title="t('settings.landing.mediaLibrary')"
        :close-label="t('common.close')"
        icon="mdi-image-multiple-outline"
        @close="dialog = false"
      />
      <v-card-text>
        <AdminDataState
          :pending="libraryLoading"
          :error-message="libraryError"
          :empty="assets.length === 0"
          :empty-title="t('settings.landing.emptyMedia')"
          empty-icon="mdi-image-off-outline"
          :retry-label="t('common.refresh')"
          @retry="loadAssets"
        >
          <div class="media-grid">
            <button
              v-for="asset in assets"
              :key="asset.id"
              type="button"
              class="media-option"
              :class="{ 'media-option--selected': asset.id === modelValue }"
              :aria-pressed="asset.id === modelValue"
              @click="select(asset)"
            >
              <v-img
                :src="asset.url ?? ''"
                :alt="asset.altText"
                aspect-ratio="1.5"
                cover
              />
              <v-icon
                v-if="asset.id === modelValue"
                class="media-option__selected"
                icon="mdi-check-circle"
                color="primary"
                size="24"
                aria-hidden="true"
              />
              <span>{{ asset.altText || asset.originalFileName }}</span>
            </button>
          </div>
        </AdminDataState>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.media-picker {
  display: grid;
  gap: 12px;
}

.media-preview {
  display: grid;
  width: 100%;
  min-height: 120px;
  max-height: 220px;
  overflow: hidden;
  place-items: center;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.media-preview :deep(.v-img) {
  width: 100%;
  height: 220px;
}

.media-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.media-option {
  position: relative;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  text-align: left;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;
}

.media-option:hover {
  border-color: rgba(var(--v-theme-primary), 0.65);
}

.media-option:focus-visible {
  outline: 3px solid rgba(var(--v-theme-primary), 0.28);
  outline-offset: 2px;
}

.media-option--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}

.media-option__selected {
  position: absolute;
  top: 8px;
  right: 8px;
  filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.85));
}

.media-option span {
  display: block;
  padding: 10px 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
