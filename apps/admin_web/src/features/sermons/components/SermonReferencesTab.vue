<script setup lang="ts">
import type { SermonReference } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  references: SermonReference[];
}>();

const emit = defineEmits<{
  add: [];
  remove: [index: number];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <div class="d-flex justify-end ga-2 mb-3">
      <v-btn size="small" variant="tonal" @click="emit('add')">
        {{ t("Add reference") }}
      </v-btn>
    </div>
    <v-card
      v-for="(reference, index) in references"
      :key="index"
      class="pa-3 mb-3"
      variant="outlined"
    >
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="reference.reference"
            :label="t('Reference')"
            density="compact"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="reference.verseId"
            :label="t('Verse ID')"
            :placeholder="t('sermons.verseIdPlaceholder')"
            density="compact"
            variant="outlined"
          />
        </v-col>
      </v-row>
      <v-text-field
        v-model.number="reference.startSeconds"
        :label="t('Start seconds')"
        type="number"
        density="compact"
        variant="outlined"
      />
      <v-textarea
        v-model="reference.note"
        :label="t('Note')"
        rows="2"
        density="compact"
        variant="outlined"
      />
      <div class="d-flex justify-end">
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
