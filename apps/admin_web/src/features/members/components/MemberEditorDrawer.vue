<script setup lang="ts">
import type { MemberProfile } from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import type { MemberEditorForm } from "../member_workspace_models";

const drawer = defineModel<boolean>({ required: true });
const props = defineProps<{
  title: string;
  member: MemberProfile | null;
  creating: boolean;
  form: MemberEditorForm;
  detailLoading: boolean;
  detailErrorMessage: string;
  commandErrorMessage: string;
  canManage: boolean;
  canSave: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  retry: [];
  save: [];
}>();

const { optionItems, t } = useI18n();
const editorDisabled = computed(() => !props.canManage || props.saving);
</script>

<template>
  <AdminResponsiveDrawer v-model="drawer" :desktop-width="500">
    <div class="pa-5">
      <div class="d-flex align-center justify-space-between ga-3">
        <div class="text-h6 font-weight-bold text-truncate">
          {{ title }}
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          :aria-label="t('common.close')"
          @click="drawer = false"
        />
      </div>

      <v-progress-linear
        v-if="detailLoading"
        indeterminate
        color="primary"
        class="mt-5"
      />
      <v-alert
        v-else-if="detailErrorMessage"
        type="error"
        variant="tonal"
        class="mt-5"
      >
        <div
          class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
        >
          <span>{{ detailErrorMessage }}</span>
          <v-btn
            color="error"
            variant="tonal"
            size="small"
            prepend-icon="mdi-refresh"
            @click="emit('retry')"
          >
            {{ t("common.refresh") }}
          </v-btn>
        </div>
      </v-alert>

      <v-form
        v-else-if="creating || member"
        class="mt-5"
        @submit.prevent="emit('save')"
      >
        <v-text-field
          v-model="form.email"
          :label="t('Email')"
          type="email"
          autocomplete="off"
          density="comfortable"
          variant="outlined"
          :disabled="editorDisabled"
        />
        <v-text-field
          v-model="form.displayName"
          :label="t('Display name')"
          density="comfortable"
          variant="outlined"
          :disabled="editorDisabled"
        />
        <v-text-field
          v-model="form.phone"
          :label="t('Phone')"
          density="comfortable"
          variant="outlined"
          :disabled="editorDisabled"
        />
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.status"
              :label="t('Status')"
              :items="optionItems(['active', 'pending', 'inactive', 'blocked'])"
              density="comfortable"
              variant="outlined"
              :disabled="editorDisabled"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.roles"
              :label="t('Roles')"
              :items="optionItems(['member', 'leader', 'pastor'])"
              multiple
              chips
              closable-chips
              density="comfortable"
              variant="outlined"
              :disabled="editorDisabled"
            />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.appLocale"
              :label="t('App locale')"
              :items="optionItems(['en', 'es', 'zh-Hans', 'zh-Hant'])"
              density="comfortable"
              variant="outlined"
              :disabled="editorDisabled"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.fellowshipGroupId"
              :label="t('Fellowship group')"
              density="comfortable"
              variant="outlined"
              :disabled="editorDisabled"
            />
          </v-col>
        </v-row>

        <div class="text-subtitle-2 font-weight-bold mb-2">
          {{ t("Notifications") }}
        </div>
        <v-row dense class="mb-2">
          <v-col cols="12" sm="6">
            <v-checkbox
              v-model="form.weeklyBulletin"
              :label="t('Weekly bulletin')"
              density="compact"
              hide-details
              :disabled="editorDisabled"
            />
            <v-checkbox
              v-model="form.sermonPublished"
              :label="t('Sermon published')"
              density="compact"
              hide-details
              :disabled="editorDisabled"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-checkbox
              v-model="form.lifePostPublished"
              :label="t('Life post published')"
              density="compact"
              hide-details
              :disabled="editorDisabled"
            />
            <v-checkbox
              v-model="form.prayerUpdates"
              :label="t('Prayer updates')"
              density="compact"
              hide-details
              :disabled="editorDisabled"
            />
          </v-col>
        </v-row>

        <v-alert
          v-if="commandErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ commandErrorMessage }}
        </v-alert>

        <div v-if="canManage" class="d-flex justify-end">
          <v-btn
            type="submit"
            color="primary"
            :disabled="!canSave || saving"
            :loading="saving"
          >
            {{ t("common.save") }}
          </v-btn>
        </div>
      </v-form>
    </div>
  </AdminResponsiveDrawer>
</template>
