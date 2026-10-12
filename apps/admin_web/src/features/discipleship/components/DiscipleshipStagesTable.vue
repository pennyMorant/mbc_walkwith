<script setup lang="ts">
import type { DiscipleshipStage } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  stages: DiscipleshipStage[];
}>();

const { t } = useI18n();
</script>

<template>
  <v-table class="mt-3" density="compact">
    <thead>
      <tr>
        <th>{{ t("Order") }}</th>
        <th>{{ t("Stage") }}</th>
        <th>{{ t("Description") }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="stages.length === 0">
        <td colspan="3">{{ t("No stages yet.") }}</td>
      </tr>
      <tr v-for="stage in stages" :key="stage.id">
        <td>{{ stage.sortOrder }}</td>
        <td>
          <div class="font-weight-medium">{{ stage.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ stage.id }}</div>
        </td>
        <td>{{ stage.description || t("common.notSet") }}</td>
      </tr>
    </tbody>
  </v-table>
</template>
