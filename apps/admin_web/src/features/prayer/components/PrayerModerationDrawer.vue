<script setup lang="ts">
import type { AdminPrayerRequest } from "@mbc/api-contracts";
import { computed, ref, watch } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminConfirmDialog from "@/core/ui/AdminConfirmDialog.vue";
import AdminDrawerHeader from "@/core/ui/AdminDrawerHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";
import {
  prayerStatusColor,
  prayerVisibilityColor
} from "../prayer_presenters";
import type { PrayerModerationForm } from "../prayer_workspace_models";

const open = defineModel<boolean>({ required: true });
const form = defineModel<PrayerModerationForm>("form", { required: true });
const props = defineProps<{
  request: AdminPrayerRequest | null;
  canModerate: boolean;
  canUpdate: boolean;
  commandPending: boolean;
  errorMessage: string;
  savePending: boolean;
  approvePending: boolean;
  hidePending: boolean;
  archivePending: boolean;
  deletePending: boolean;
}>();
const emit = defineEmits<{
  save: [];
  approve: [];
  hide: [];
  archive: [];
  delete: [];
}>();
const deleteDialog = ref(false);
const { optionItems, t } = useI18n();
const requestSubtitle = computed(() => {
  if (!props.request) return "";
  const submitter = props.request.submitterName || t("Anonymous");
  return props.request.submitterEmail
    ? `${submitter} · ${props.request.submitterEmail}`
    : submitter;
});

watch(
  () => props.request?.id,
  () => {
    deleteDialog.value = false;
  }
);

function confirmDelete() {
  deleteDialog.value = false;
  emit("delete");
}
</script>

<template>
  <AdminResponsiveDrawer v-model="open" :desktop-width="560">
    <div v-if="request" class="pa-5">
      <AdminDrawerHeader
        :title="request.title"
        :subtitle="requestSubtitle"
        :close-label="t('common.close')"
        @close="open = false"
      >
        <template #meta>
          <v-chip size="small" :color="prayerStatusColor(request.status)">
            {{ t(request.status) }}
          </v-chip>
          <v-chip
            size="small"
            variant="tonal"
            :color="prayerVisibilityColor(request.visibility)"
          >
            {{ t(request.visibility) }}
          </v-chip>
        </template>
      </AdminDrawerHeader>

      <v-alert type="info" variant="tonal" class="mt-5">
        {{ t("prayer.sensitiveNotice") }}
      </v-alert>
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-4"
      >
        {{ errorMessage }}
      </v-alert>
      <div class="mt-5 text-body-1 prayer-body">{{ request.body }}</div>
      <v-divider class="my-5" />

      <v-form @submit.prevent="emit('save')">
        <v-select
          v-model="form.visibility"
          :label="t('Visibility')"
          :items="optionItems(['private', 'public', 'group', 'members'])"
          density="comfortable"
          variant="outlined"
          :disabled="!canModerate || commandPending"
        />
        <v-text-field
          v-if="form.visibility === 'group'"
          v-model="form.groupId"
          :label="t('Group ID')"
          density="comfortable"
          variant="outlined"
          :disabled="!canModerate || commandPending"
        />
        <v-textarea
          v-model="form.moderationNote"
          :label="t('Moderation note')"
          rows="4"
          density="comfortable"
          variant="outlined"
          :disabled="!canModerate || commandPending"
        />
        <v-switch
          v-model="form.notifyAppOnApprove"
          :label="t('prayer.notifyAppOnApprove')"
          :hint="t('prayer.notifyAppOnApproveHint')"
          color="primary"
          density="comfortable"
          persistent-hint
          :disabled="!canModerate || commandPending"
        />

        <v-btn
          type="submit"
          block
          color="primary"
          variant="tonal"
          class="mb-4"
          :disabled="!canUpdate || commandPending"
          :loading="savePending"
        >
          {{ t("Save moderation details") }}
        </v-btn>
      </v-form>

      <div class="d-flex flex-wrap ga-2">
        <v-btn
          color="success"
          variant="tonal"
          :disabled="!canUpdate || commandPending"
          :loading="approvePending"
          @click="emit('approve')"
        >
          {{ t("Approve") }}
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :disabled="!canModerate || commandPending"
          :loading="hidePending"
          @click="emit('hide')"
        >
          {{ t("Hide") }}
        </v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          :disabled="!canModerate || commandPending"
          :loading="archivePending"
          @click="emit('archive')"
        >
          {{ t("Archive") }}
        </v-btn>
        <v-spacer />
        <v-btn
          icon="mdi-delete-outline"
          color="error"
          variant="text"
          :aria-label="t('Delete')"
          :disabled="!canModerate || commandPending"
          @click="deleteDialog = true"
        />
      </div>
    </div>
  </AdminResponsiveDrawer>

  <AdminConfirmDialog
    v-model="deleteDialog"
    :title="t('Delete prayer request?')"
    :message="t('This permanently removes the prayer request content.')"
    :confirm-label="t('Delete')"
    :cancel-label="t('common.cancel')"
    color="error"
    icon="mdi-delete-outline"
    :loading="deletePending"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
.prayer-body {
  white-space: pre-wrap;
}
</style>
