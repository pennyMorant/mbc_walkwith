<script setup lang="ts">
import type { AdminPrayerRequest } from "@mbc/api-contracts";
import { ref, watch } from "vue";

import { useI18n } from "@/core/i18n/i18n";
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
  <v-navigation-drawer v-model="open" location="right" temporary width="560">
    <div v-if="request" class="pa-5">
      <div class="d-flex align-start justify-space-between ga-4">
        <div class="min-width-0">
          <div class="text-h6 font-weight-bold">{{ request.title }}</div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ request.submitterName || t("Anonymous") }}
            <span v-if="request.submitterEmail">
              · {{ request.submitterEmail }}
            </span>
          </div>
        </div>
        <div class="d-flex ga-2 flex-shrink-0">
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
        </div>
      </div>

      <v-alert type="info" variant="tonal" class="mt-5">
        {{ t("prayer.sensitiveNotice") }}
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
        />
        <v-text-field
          v-if="form.visibility === 'group'"
          v-model="form.groupId"
          :label="t('Group ID')"
          density="comfortable"
          variant="outlined"
        />
        <v-textarea
          v-model="form.moderationNote"
          :label="t('Moderation note')"
          rows="4"
          density="comfortable"
          variant="outlined"
        />
        <v-switch
          v-model="form.notifyAppOnApprove"
          :label="t('prayer.notifyAppOnApprove')"
          :hint="t('prayer.notifyAppOnApproveHint')"
          color="primary"
          density="comfortable"
          persistent-hint
          :disabled="!canModerate"
        />

        <v-btn
          type="submit"
          block
          color="primary"
          variant="tonal"
          class="mb-4"
          :disabled="!canUpdate || savePending"
          :loading="savePending"
        >
          {{ t("Save moderation details") }}
        </v-btn>
      </v-form>

      <div class="d-flex flex-wrap ga-2">
        <v-btn
          color="success"
          variant="tonal"
          :disabled="!canUpdate || approvePending"
          :loading="approvePending"
          @click="emit('approve')"
        >
          {{ t("Approve") }}
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :disabled="!canModerate || hidePending"
          :loading="hidePending"
          @click="emit('hide')"
        >
          {{ t("Hide") }}
        </v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          :disabled="!canModerate || archivePending"
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
          :disabled="!canModerate || deletePending"
          @click="deleteDialog = true"
        />
      </div>
    </div>
  </v-navigation-drawer>

  <v-dialog v-model="deleteDialog" max-width="440">
    <v-card>
      <v-card-title>{{ t("Delete prayer request?") }}</v-card-title>
      <v-card-text>
        {{ t("This permanently removes the prayer request content.") }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog = false">
          {{ t("common.cancel") }}
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :loading="deletePending"
          @click="confirmDelete"
        >
          {{ t("Delete") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.prayer-body {
  white-space: pre-wrap;
}
</style>
