<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import MediaAssetEditDialog from "../components/MediaAssetEditDialog.vue";
import MediaCleanupCard from "../components/MediaCleanupCard.vue";
import MediaLibraryCard from "../components/MediaLibraryCard.vue";
import { useMediaPageController } from "../composables/use_media_page_controller";

const {
  applyCleanupStatus,
  applyLibraryFilters,
  assets,
  assetsQuery,
  canManage,
  canRead,
  cleanupErrorMessage,
  cleanupQuery,
  cleanupRefreshErrorMessage,
  cleanupRetryErrorMessage,
  cleanupStatus,
  cleanupTasks,
  clearLibraryFilters,
  edit,
  editDialog,
  libraryErrorMessage,
  libraryFilters,
  libraryRefreshErrorMessage,
  refreshCleanup,
  refreshLibrary,
  retryCleanup,
  retryingTaskId,
  save,
  selectedAsset,
  t,
  updateErrorMessage,
  updateMutation,
  upload,
  uploadErrorMessage,
  uploadMutation,
  usageQuery,
  usages,
  usagesErrorMessage,
  usagesRefreshErrorMessage
} = useMediaPageController();
</script>

<template>
  <div>
    <AdminPageHeader :title="t('media.title')" :subtitle="t('media.subtitle')" />
    <MediaLibraryCard
      v-model:filters="libraryFilters"
      class="mt-6"
      :assets="assets"
      :can-manage="canManage"
      :pending="assetsQuery.isPending.value"
      :fetching="assetsQuery.isFetching.value"
      :error-message="libraryErrorMessage"
      :refresh-error-message="libraryRefreshErrorMessage"
      :uploading="uploadMutation.isPending.value"
      :upload-error-message="uploadErrorMessage"
      @apply="applyLibraryFilters"
      @clear="clearLibraryFilters"
      @edit="edit"
      @retry="refreshLibrary"
      @upload="upload"
    />
    <MediaCleanupCard
      v-model:status="cleanupStatus"
      :tasks="cleanupTasks"
      :can-read="canRead"
      :can-retry="canManage"
      :pending="cleanupQuery.isPending.value"
      :fetching="cleanupQuery.isFetching.value"
      :error-message="cleanupErrorMessage"
      :refresh-error-message="cleanupRefreshErrorMessage"
      :retry-error-message="cleanupRetryErrorMessage"
      :retrying-task-id="retryingTaskId"
      @apply="applyCleanupStatus"
      @retry-query="refreshCleanup"
      @retry-task="retryCleanup"
    />
    <MediaAssetEditDialog
      v-model="editDialog"
      :asset="selectedAsset"
      :saving="updateMutation.isPending.value"
      :error="updateErrorMessage"
      :usages="usages"
      :usages-loading="usageQuery.isPending.value"
      :usages-error="usagesErrorMessage"
      :usages-refresh-error="usagesRefreshErrorMessage"
      @retry-usages="usageQuery.refetch()"
      @save="save"
    />
  </div>
</template>
