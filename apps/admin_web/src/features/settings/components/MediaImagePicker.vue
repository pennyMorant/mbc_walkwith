<script setup lang="ts">
import type { MediaAsset } from "@mbc/api-contracts";
import { computed, onMounted, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { listMediaImages, uploadMediaImage } from "@/core/api/media";
import { useI18n } from "@/core/i18n/i18n";
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
const loading = ref(false);
const assets = ref<MediaAsset[]>([]);
const error = ref("");
const previewUrl = computed(
  () => assets.value.find((asset) => asset.id === props.modelValue)?.url ?? ""
);

onMounted(loadAssets);

async function loadAssets() {
  try {
    assets.value = await listMediaImages();
  } catch (cause) {
    error.value = formatApiErrorMessage(cause, t("common.error"));
  }
}

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  loading.value = true;
  error.value = "";
  try {
    const asset = await uploadMediaImage(file, props.altText);
    assets.value = [asset, ...assets.value.filter((item) => item.id !== asset.id)];
    select(asset);
  } catch (cause) {
    error.value = formatApiErrorMessage(cause, t("common.error"));
  } finally {
    loading.value = false;
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
      <input ref="input" hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" @change="onFileChange" />
      <v-btn prepend-icon="mdi-cloud-upload-outline" color="primary" variant="tonal" :loading="loading" @click="input?.click()">
        {{ t("settings.landing.uploadImage") }}
      </v-btn>
      <v-btn prepend-icon="mdi-image-multiple-outline" variant="text" @click="dialog = true">
        {{ t("settings.landing.chooseImage") }}
      </v-btn>
      <v-btn v-if="modelValue" icon="mdi-close" variant="text" :aria-label="t('settings.landing.removeImage')" @click="emit('update:modelValue', null)" />
    </div>
    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>
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
        <div v-if="assets.length" class="media-grid">
          <button v-for="asset in assets" :key="asset.id" type="button" class="media-option" @click="select(asset)">
            <v-img :src="asset.url ?? ''" :alt="asset.altText" aspect-ratio="1.5" cover />
            <span>{{ asset.altText || asset.originalFileName }}</span>
          </button>
        </div>
        <v-empty-state v-else icon="mdi-image-off-outline" :title="t('settings.landing.emptyMedia')" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.media-picker { display: grid; gap: 12px; }
.media-preview { width: 100%; min-height: 120px; max-height: 220px; overflow: hidden; display: grid; place-items: center; border-radius: 8px; background: rgb(var(--v-theme-surface-variant)); }
.media-preview :deep(.v-img) { width: 100%; height: 220px; }
.media-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.media-option { padding: 0; overflow: hidden; text-align: left; border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px; background: rgb(var(--v-theme-surface)); cursor: pointer; }
.media-option span { display: block; padding: 10px 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
