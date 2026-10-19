<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import MediaCleanupCard from "../components/MediaCleanupCard.vue";

const { t } = useI18n();
</script>

<template>
  <div>
    <div class="page-title">{{ t("media.title") }}</div>
    <div class="page-subtitle">{{ t("media.subtitle") }}</div>
    <MediaCleanupCard />
  </div>
</template>
