<script setup lang="ts">
import type { MemberProfile } from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminDrawerHeader from "@/core/ui/AdminDrawerHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";

import type { MemberEditorForm } from "../member_workspace_models";
import MemberNotificationFields from "./MemberNotificationFields.vue";
import MemberProfileFields from "./MemberProfileFields.vue";

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

const { t } = useI18n();
const editorDisabled = computed(() => !props.canManage || props.saving);
</script>

<template>
  <AdminResponsiveDrawer v-model="drawer" :desktop-width="500">
    <div class="pa-5">
      <AdminDrawerHeader
        :title="title"
        :close-label="t('common.close')"
        @close="drawer = false"
      />

      <v-progress-linear
        v-if="detailLoading"
        indeterminate
        color="primary"
        class="mt-5"
      />
      <AdminRetryAlert
        v-else-if="detailErrorMessage"
        :message="detailErrorMessage"
        :retry-label="t('common.refresh')"
        class="mt-5"
        @retry="emit('retry')"
      />

      <v-form
        v-else-if="creating || member"
        class="mt-5"
        @submit.prevent="emit('save')"
      >
        <MemberProfileFields :form="form" :disabled="editorDisabled" />
        <MemberNotificationFields :form="form" :disabled="editorDisabled" />

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
