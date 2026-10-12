<script setup lang="ts">
import type {
  Course,
  CourseStatus,
  CourseUpsertRequest,
  LifePostVisibility
} from "@mbc/api-contracts";

import { courseStatusOptions } from "@/core/api/courses";
import { useI18n } from "@/core/i18n/i18n";

const model = defineModel<boolean>({ required: true });
const form = defineModel<CourseUpsertRequest>("form", { required: true });
const { optionItems, t } = useI18n();

defineProps<{
  course: Course | null;
  canManage: boolean;
  canSave: boolean;
  saving: boolean;
}>();

defineEmits<{
  save: [];
}>();

const visibilityOptions: LifePostVisibility[] = ["public", "members", "private"];
const statusOptions: CourseStatus[] = courseStatusOptions;
</script>

<template>
  <v-navigation-drawer
    v-model="model"
    location="right"
    temporary
    width="480"
    class="pa-0"
  >
    <v-toolbar flat>
      <v-toolbar-title>
        {{ course ? t("Edit course") : t("New course") }}
      </v-toolbar-title>
      <v-btn icon="mdi-close" variant="text" @click="model = false" />
    </v-toolbar>
    <v-divider />
    <div class="pa-4">
      <v-text-field
        v-model="form.title"
        :label="t('Title')"
        :disabled="!canManage"
        variant="outlined"
        density="comfortable"
      />
      <v-textarea
        v-model="form.description"
        :label="t('Description')"
        :disabled="!canManage"
        variant="outlined"
        rows="4"
      />
      <v-text-field
        v-model="form.teacherName"
        :label="t('Teacher')"
        :disabled="!canManage"
        variant="outlined"
        density="comfortable"
      />
      <v-text-field
        v-model="form.scheduleText"
        :label="t('Schedule')"
        :disabled="!canManage"
        variant="outlined"
        density="comfortable"
      />
      <v-text-field
        v-model="form.location"
        :label="t('Location')"
        :disabled="!canManage"
        variant="outlined"
        density="comfortable"
      />
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.visibility"
            :label="t('Visibility')"
            :items="optionItems(visibilityOptions)"
            :disabled="!canManage"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.status"
            :label="t('Status')"
            :items="optionItems(statusOptions)"
            :disabled="!canManage"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
      </v-row>
      <v-text-field
        v-model.number="form.capacity"
        :label="t('Capacity')"
        type="number"
        min="1"
        clearable
        :disabled="!canManage"
        variant="outlined"
        density="comfortable"
      />
      <v-btn
        v-if="canManage"
        block
        color="primary"
        :disabled="!canSave || saving"
        :loading="saving"
        @click="$emit('save')"
      >
        {{ t("common.save") }}
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>
