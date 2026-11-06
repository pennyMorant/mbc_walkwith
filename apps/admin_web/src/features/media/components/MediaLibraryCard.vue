<script setup lang="ts">
import type { MediaAsset } from "@mbc/api-contracts";
import { ref } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";

import type { MediaLibraryFilterForm } from "../media_workspace_models";
import MediaAssetTable from "./MediaAssetTable.vue";

const filters = defineModel<MediaLibraryFilterForm>("filters", {
  required: true
});
defineProps<{
  assets: MediaAsset[];
  canManage: boolean;
  pending: boolean;
  fetching: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  uploading: boolean;
  uploadErrorMessage: string;
}>();
const emit = defineEmits<{
  apply: [];
  clear: [];
  edit: [asset: MediaAsset];
  retry: [];
  upload: [file: File];
}>();
const fileInput = ref<HTMLInputElement | null>(null);
const visibilities = ["", "public", "private"] as const;
const consentStatuses = ["", "pending", "approved", "restricted"] as const;
const { optionItems, t } = useI18n();

function selectFile() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) emit("upload", file);
  target.value = "";
}
</script>

<template>
  <v-card variant="outlined">
    <div class="pa-5">
      <div
        class="d-flex flex-column flex-lg-row align-start align-lg-center justify-space-between ga-4"
      >
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            {{ t("media.libraryTitle") }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ t("media.librarySubtitle") }}
          </div>
        </div>
        <div class="library-actions">
          <v-select
            v-model="filters.visibility"
            :items="optionItems(visibilities)"
            :label="t('media.visibility')"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-select
            v-model="filters.consentStatus"
            :items="optionItems(consentStatuses)"
            :label="t('media.consentStatus')"
            density="compact"
            variant="outlined"
            hide-details
          />
          <div class="d-flex justify-end ga-2">
            <v-btn
              type="button"
              icon="mdi-filter-remove-outline"
              variant="text"
              :disabled="fetching"
              :aria-label="t('media.clearFilters')"
              :title="t('media.clearFilters')"
              @click="emit('clear')"
            />
            <v-btn
              type="button"
              icon="mdi-filter-check-outline"
              color="primary"
              variant="tonal"
              :loading="fetching"
              :aria-label="t('media.applyFilters')"
              :title="t('media.applyFilters')"
              @click="emit('apply')"
            />
            <input
              ref="fileInput"
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              @change="onFileChange"
            />
            <v-btn
              v-if="canManage"
              color="primary"
              prepend-icon="mdi-cloud-upload-outline"
              :loading="uploading"
              @click="selectFile"
            >
              {{ t("media.upload") }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>
    <v-divider />
    <v-alert
      v-if="uploadErrorMessage"
      type="error"
      variant="tonal"
      class="ma-4 mb-0"
    >
      {{ uploadErrorMessage }}
    </v-alert>
    <AdminRefreshAlert
      class="ma-4 mb-0"
      :message="refreshErrorMessage"
      :retry-label="t('common.refresh')"
      @retry="emit('retry')"
    />
    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="assets.length === 0"
      :empty-title="t('media.libraryEmpty')"
      empty-icon="mdi-image-off-outline"
      :retry-label="t('common.refresh')"
      @retry="emit('retry')"
    >
      <MediaAssetTable
        :assets="assets"
        :can-manage="canManage"
        @edit="emit('edit', $event)"
      />
    </AdminDataState>
  </v-card>
</template>

<style scoped>
.library-actions {
  display: grid;
  width: min(100%, 860px);
  grid-template-columns: repeat(2, minmax(150px, 1fr)) auto;
  align-items: center;
  gap: 8px;
}

@media (max-width: 860px) {
  .library-actions {
    grid-template-columns: 1fr;
  }
}
</style>
