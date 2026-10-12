<script setup lang="ts">
import type { SermonOutlineItem } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  outline: SermonOutlineItem[];
}>();

const emit = defineEmits<{
  add: [];
  remove: [index: number];
  move: [index: number, direction: -1 | 1];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <div class="d-flex justify-end ga-2 mb-3">
      <v-btn size="small" variant="tonal" @click="emit('add')">
        {{ t("Add outline") }}
      </v-btn>
    </div>
    <v-card
      v-for="(item, index) in outline"
      :key="index"
      class="pa-3 mb-3"
      variant="outlined"
    >
      <v-text-field
        v-model="item.title"
        :label="t('Title')"
        density="compact"
        variant="outlined"
      />
      <v-text-field
        v-model.number="item.startSeconds"
        :label="t('Start seconds')"
        type="number"
        density="compact"
        variant="outlined"
      />
      <v-textarea
        v-model="item.summary"
        :label="t('Summary')"
        rows="2"
        density="compact"
        variant="outlined"
      />
      <div class="d-flex justify-end">
        <v-btn
          size="small"
          variant="text"
          :disabled="index === 0"
          @click="emit('move', index, -1)"
        >
          {{ t("Move up") }}
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          :disabled="index === outline.length - 1"
          @click="emit('move', index, 1)"
        >
          {{ t("Move down") }}
        </v-btn>
        <v-btn
          size="small"
          color="error"
          variant="text"
          @click="emit('remove', index)"
        >
          {{ t("Remove") }}
        </v-btn>
      </div>
    </v-card>
  </div>
</template>
