<script setup lang="ts">
import type {
  MediaAsset,
  MediaAssetUpdateRequest,
  MediaConsentStatus,
  MediaVisibility
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  listMediaAssets,
  listMediaAssetUsages,
  updateMediaAsset,
  uploadMediaImage
} from "@/core/api/media";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import MediaAssetEditDialog from "./MediaAssetEditDialog.vue";
import MediaAssetTable from "./MediaAssetTable.vue";

const queryKey = ["admin-media-assets"];
const visibilities = ["", "public", "private"] as const;
const consentStatuses = ["", "pending", "approved", "restricted"] as const;
const authStore = useAdminAuthStore();
const queryClient = useQueryClient();
const { optionItems, t } = useI18n();
const visibility = ref<MediaVisibility | "">("");
const consentStatus = ref<MediaConsentStatus | "">("");
const selectedAsset = ref<MediaAsset | null>(null);
const editDialog = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadError = ref("");
const canManage = computed(() => authStore.can("media:manage"));

const assetsQuery = useQuery({
  queryKey: [...queryKey, visibility, consentStatus],
  queryFn: () =>
    listMediaAssets({
      kind: "image",
      ...(visibility.value ? { visibility: visibility.value } : {}),
      ...(consentStatus.value
        ? { consentStatus: consentStatus.value }
        : {}),
      limit: 100
    })
});
const updateMutation = useMutation({
  mutationFn: ({
    id,
    input
  }: {
    id: string;
    input: MediaAssetUpdateRequest;
  }) => updateMediaAsset(id, input),
  onSuccess: async () => {
    editDialog.value = false;
    await queryClient.invalidateQueries({ queryKey });
  }
});
const uploadMutation = useMutation({
  mutationFn: (file: File) => uploadMediaImage(file),
  onSuccess: () => queryClient.invalidateQueries({ queryKey })
});
const assets = computed(() => assetsQuery.data.value ?? []);
const usageQuery = useQuery({
  queryKey: [
    "admin-media-asset-usages",
    computed(() => selectedAsset.value?.id ?? "")
  ],
  enabled: computed(() => editDialog.value && Boolean(selectedAsset.value)),
  queryFn: () => listMediaAssetUsages(selectedAsset.value!.id)
});
const updateError = computed(() =>
  updateMutation.error.value
    ? formatApiErrorMessage(updateMutation.error.value, t("common.error"))
    : ""
);

function edit(asset: MediaAsset) {
  selectedAsset.value = asset;
  editDialog.value = true;
  updateMutation.reset();
}

function save(input: MediaAssetUpdateRequest) {
  if (!selectedAsset.value || !canManage.value) return;
  updateMutation.mutate({ id: selectedAsset.value.id, input });
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  uploadError.value = "";
  try {
    await uploadMutation.mutateAsync(file);
  } catch (error) {
    uploadError.value = formatApiErrorMessage(error, t("common.error"));
  } finally {
    target.value = "";
  }
}

</script>

<template>
  <v-card>
    <div class="pa-5 d-flex flex-column flex-lg-row align-start align-lg-center justify-space-between ga-4">
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
          v-model="visibility"
          :items="optionItems(visibilities)"
          :label="t('media.visibility')"
          density="compact"
          variant="outlined"
          hide-details
        />
        <v-select
          v-model="consentStatus"
          :items="optionItems(consentStatuses)"
          :label="t('media.consentStatus')"
          density="compact"
          variant="outlined"
          hide-details
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
          :loading="uploadMutation.isPending.value"
          @click="fileInput?.click()"
        >
          {{ t("media.upload") }}
        </v-btn>
      </div>
    </div>
    <v-divider />
    <v-alert v-if="uploadError" type="error" variant="tonal" class="ma-4">
      {{ uploadError }}
    </v-alert>
    <v-progress-linear
      v-if="assetsQuery.isPending.value"
      indeterminate
      color="primary"
    />
    <v-alert
      v-else-if="assetsQuery.error.value"
      type="error"
      variant="tonal"
      class="ma-4"
    >
      {{ formatApiErrorMessage(assetsQuery.error.value, t("common.error")) }}
    </v-alert>
    <v-empty-state
      v-else-if="assets.length === 0"
      icon="mdi-image-off-outline"
      :title="t('media.libraryEmpty')"
    />
    <MediaAssetTable
      v-else
      :assets="assets"
      :can-manage="canManage"
      @edit="edit"
    />
  </v-card>

  <MediaAssetEditDialog
    v-model="editDialog"
    :asset="selectedAsset"
    :saving="updateMutation.isPending.value"
    :error="updateError"
    :usages="usageQuery.data.value ?? []"
    :usages-loading="usageQuery.isPending.value"
    :usages-error="usageQuery.error.value ? formatApiErrorMessage(usageQuery.error.value, t('common.error')) : ''"
    @save="save"
  />
</template>

<style scoped>
.library-actions {
  width: min(100%, 760px);
  display: grid;
  grid-template-columns: repeat(2, minmax(150px, 1fr)) auto;
  gap: 8px;
  align-items: center;
}

@media (max-width: 760px) {
  .library-actions {
    grid-template-columns: 1fr;
  }
}
</style>
