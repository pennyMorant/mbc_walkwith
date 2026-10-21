<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

const { t } = useI18n();
</script>

<template>
  <div class="access-denied-page">
    <v-empty-state
      icon="mdi-shield-lock-outline"
      :headline="t('auth.accessDeniedTitle')"
      :text="t('auth.accessDeniedMessage')"
    />
    <p class="access-denied-page__help text-body-2 text-medium-emphasis">
      {{ t("auth.accessDeniedHelp") }}
    </p>
  </div>
</template>

<style scoped>
.access-denied-page {
  min-height: calc(100vh - 128px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.access-denied-page :deep(.v-empty-state) {
  width: min(100%, 560px);
}

.access-denied-page__help {
  max-width: 480px;
  margin: -20px 24px 0;
  text-align: center;
}
</style>
