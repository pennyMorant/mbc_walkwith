<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import MediaCleanupCard from "../components/MediaCleanupCard.vue";
import MediaLibraryCard from "../components/MediaLibraryCard.vue";

const { t } = useI18n();
</script>

<template>
  <div>
    <AdminPageHeader :title="t('media.title')" :subtitle="t('media.subtitle')" />
    <MediaLibraryCard class="mt-6" />
    <MediaCleanupCard />
  </div>
</template>
